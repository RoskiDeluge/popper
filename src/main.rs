use std::env;
use std::fs::File;
#[allow(unused_imports)]
use std::io::{self, Write};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::process::CommandExt;
use std::path::Path;
use std::process::{Command, Stdio};

fn main() {
    loop {
        print!("$ ");
        io::stdout().flush().unwrap();

        let mut command = String::new();

        io::stdin().read_line(&mut command).unwrap();

        let input = command.trim();

        if input.starts_with("exit") {
            let parts: Vec<&str> = input.split_whitespace().collect();
            let exit_code = if parts.len() > 1 {
                parts[1].parse::<i32>().unwrap_or(0)
            } else {
                0
            };
            std::process::exit(exit_code);
        }

        if input.starts_with("echo ") {
            let args_str = &input[5..]; // Skip "echo "
            let args = parse_arguments(args_str);
            let (cmd_args, stdout_file, stderr_file) = parse_redirection(&args);

            let output_text = cmd_args.join(" ");

            if let Some(file_path) = stdout_file {
                // Redirect stdout to file
                match File::create(&file_path) {
                    Ok(mut file) => {
                        writeln!(file, "{}", output_text).ok();
                    }
                    Err(_) => {
                        eprintln!("Failed to create file: {}", file_path);
                    }
                }
            } else {
                // Print to stdout
                println!("{}", output_text);
            }

            // Create stderr file even if empty (echo doesn't write to stderr)
            if let Some(file_path) = stderr_file {
                File::create(&file_path).ok();
            }

            continue;
        }

        if input == "pwd" {
            match env::current_dir() {
                Ok(path) => println!("{}", path.display()),
                Err(_) => eprintln!("pwd: error getting current directory"),
            }
            continue;
        }

        if input.starts_with("cd ") {
            let path = &input[3..]; // Skip "cd "

            // Expand ~ to HOME directory
            let expanded_path = if path == "~" || path.starts_with("~/") {
                if let Ok(home) = env::var("HOME") {
                    if path == "~" {
                        home
                    } else {
                        path.replacen("~", &home, 1)
                    }
                } else {
                    path.to_string()
                }
            } else {
                path.to_string()
            };

            if let Err(_) = env::set_current_dir(&expanded_path) {
                println!("cd: {}: No such file or directory", path);
            }
            continue;
        }

        if input.starts_with("type ") {
            let cmd = &input[5..]; // Skip "type "
            if cmd == "echo" || cmd == "exit" || cmd == "type" || cmd == "pwd" || cmd == "cd" {
                println!("{} is a shell builtin", cmd);
            } else {
                // Search for executable in PATH
                if let Some(path) = find_in_path(cmd) {
                    println!("{} is {}", cmd, path);
                } else {
                    println!("{}: not found", cmd);
                }
            }
            continue;
        }

        // Try to execute as external program
        let parts = parse_arguments(input);
        if parts.is_empty() {
            continue;
        }

        // Check for output redirection
        let (cmd_parts, stdout_file, stderr_file) = parse_redirection(&parts);

        if cmd_parts.is_empty() {
            continue;
        }

        let cmd = cmd_parts[0].as_str();

        // Check if it's a builtin that doesn't need arguments
        if cmd == "exit" || cmd == "echo" || cmd == "type" || cmd == "pwd" || cmd == "cd" {
            println!("{}: command not found", input);
            continue;
        }

        // Search for executable in PATH
        if let Some(path) = find_in_path(cmd) {
            let args = &cmd_parts[1..];

            let mut command = Command::new(path);
            command.arg0(cmd).args(args);

            // Setup stdout redirection if specified
            if let Some(ref file_path) = stdout_file {
                match File::create(file_path) {
                    Ok(file) => {
                        command.stdout(Stdio::from(file));
                    }
                    Err(_) => {
                        eprintln!("Failed to create file: {}", file_path);
                        continue;
                    }
                }
            }

            // Setup stderr redirection if specified
            if let Some(ref file_path) = stderr_file {
                match File::create(file_path) {
                    Ok(file) => {
                        command.stderr(Stdio::from(file));
                    }
                    Err(_) => {
                        eprintln!("Failed to create file: {}", file_path);
                        continue;
                    }
                }
            }

            let output = command.output();

            match output {
                Ok(output) => {
                    if stdout_file.is_none() {
                        io::stdout().write_all(&output.stdout).unwrap();
                    }
                    if stderr_file.is_none() {
                        io::stderr().write_all(&output.stderr).unwrap();
                    }
                }
                Err(_) => {
                    println!("{}: command not found", input);
                }
            }
        } else {
            println!("{}: command not found", input);
        }
    }
}

fn find_in_path(cmd: &str) -> Option<String> {
    let path_env = env::var("PATH").ok()?;

    for dir in path_env.split(':') {
        let full_path = Path::new(dir).join(cmd);

        if full_path.exists() {
            if let Ok(metadata) = std::fs::metadata(&full_path) {
                let permissions = metadata.permissions();
                // Check if file has execute permission (user, group, or other)
                if permissions.mode() & 0o111 != 0 {
                    return full_path.to_str().map(|s| s.to_string());
                }
            }
        }
    }

    None
}

fn parse_arguments(input: &str) -> Vec<String> {
    let mut args = Vec::new();
    let mut current_arg = String::new();
    let mut in_single_quote = false;
    let mut in_double_quote = false;
    let mut chars = input.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '\\' if !in_single_quote => {
                // Backslash escapes certain special characters
                if let Some(&next_ch) = chars.peek() {
                    // In double quotes, only escape: \ " $ `
                    // Outside quotes, escape any character
                    if in_double_quote {
                        if next_ch == '\\' || next_ch == '"' || next_ch == '$' || next_ch == '`' {
                            chars.next(); // consume the next character
                            current_arg.push(next_ch);
                        } else {
                            // Not a special character, keep the backslash
                            current_arg.push(ch);
                        }
                    } else {
                        // Outside quotes, backslash escapes any character
                        chars.next(); // consume the next character
                        current_arg.push(next_ch);
                    }
                }
            }
            '\'' if !in_double_quote => {
                in_single_quote = !in_single_quote;
            }
            '"' if !in_single_quote => {
                in_double_quote = !in_double_quote;
            }
            ' ' | '\t' if !in_single_quote && !in_double_quote => {
                if !current_arg.is_empty() {
                    args.push(current_arg.clone());
                    current_arg.clear();
                }
            }
            _ => {
                current_arg.push(ch);
            }
        }
    }

    if !current_arg.is_empty() {
        args.push(current_arg);
    }

    args
}

fn parse_redirection(parts: &[String]) -> (Vec<String>, Option<String>, Option<String>) {
    let mut cmd_parts = Vec::new();
    let mut stdout_file = None;
    let mut stderr_file = None;
    let mut i = 0;

    while i < parts.len() {
        let part = &parts[i];

        // Check for > or 1> (stdout)
        if part == ">" || part == "1>" {
            // Next part should be the filename
            if i + 1 < parts.len() {
                stdout_file = Some(parts[i + 1].clone());
                i += 2;
                continue;
            }
        } else if part == "2>" {
            // Next part should be the filename for stderr
            if i + 1 < parts.len() {
                stderr_file = Some(parts[i + 1].clone());
                i += 2;
                continue;
            }
        } else if part.starts_with(">") && !part.starts_with("2>") {
            // Handle cases like >file (no space)
            stdout_file = Some(part[1..].to_string());
            i += 1;
            continue;
        } else if part.starts_with("1>") {
            // Handle cases like 1>file (no space)
            stdout_file = Some(part[2..].to_string());
            i += 1;
            continue;
        } else if part.starts_with("2>") {
            // Handle cases like 2>file (no space)
            stderr_file = Some(part[2..].to_string());
            i += 1;
            continue;
        }

        cmd_parts.push(part.clone());
        i += 1;
    }

    (cmd_parts, stdout_file, stderr_file)
}
