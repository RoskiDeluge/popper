use rustyline::completion::{Completer, Pair};
use rustyline::error::ReadlineError;
use rustyline::highlight::Highlighter;
use rustyline::hint::Hinter;
use rustyline::validate::Validator;
use rustyline::{CompletionType, Config, Context, Editor, Helper};
use std::env;
use std::fs::File;
#[allow(unused_imports)]
use std::io::{self, Write};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::process::CommandExt;
use std::path::Path;
use std::process::{Command, Stdio};

struct ShellHelper;

impl Helper for ShellHelper {}

impl Completer for ShellHelper {
    type Candidate = Pair;

    fn complete(
        &self,
        line: &str,
        pos: usize,
        _ctx: &Context<'_>,
    ) -> rustyline::Result<(usize, Vec<Pair>)> {
        let builtins = ["echo ", "exit ", "type ", "pwd", "cd "];

        let input = &line[..pos];
        let mut candidates = Vec::new();

        // Check builtins first
        for builtin in &builtins {
            if builtin.starts_with(input) && !input.is_empty() {
                candidates.push(Pair {
                    display: builtin.to_string(),
                    replacement: builtin.to_string(),
                });
            }
        }

        // Search for executables in PATH
        if !input.is_empty() {
            if let Ok(path_env) = env::var("PATH") {
                for dir in path_env.split(':') {
                    let path = Path::new(dir);
                    if let Ok(entries) = std::fs::read_dir(path) {
                        for entry in entries.flatten() {
                            if let Ok(file_name) = entry.file_name().into_string() {
                                if file_name.starts_with(input) {
                                    // Check if executable
                                    if let Ok(metadata) = entry.metadata() {
                                        let permissions = metadata.permissions();
                                        if permissions.mode() & 0o111 != 0 {
                                            // Avoid duplicates
                                            if !candidates
                                                .iter()
                                                .any(|c| c.replacement.trim() == file_name)
                                            {
                                                candidates.push(Pair {
                                                    display: file_name.clone(),
                                                    replacement: format!("{} ", file_name),
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sort candidates alphabetically
        candidates.sort_by(|a, b| a.display.cmp(&b.display));

        Ok((0, candidates))
    }
}

impl Hinter for ShellHelper {
    type Hint = String;
}

impl Highlighter for ShellHelper {}

impl Validator for ShellHelper {}

fn main() {
    let config = Config::builder()
        .completion_type(CompletionType::List)
        .build();
    let mut rl = Editor::with_config(config).unwrap();
    rl.set_helper(Some(ShellHelper));

    loop {
        let readline = rl.readline("$ ");

        let input = match readline {
            Ok(line) => line,
            Err(ReadlineError::Interrupted) | Err(ReadlineError::Eof) => {
                break;
            }
            Err(_) => {
                continue;
            }
        };

        let input = input.trim();

        // Parse input first to check for pipelines
        let parts = parse_arguments(input);
        if parts.is_empty() {
            continue;
        }

        // Check for pipeline first (before handling built-ins)
        if let Some(pipe_pos) = parts.iter().position(|p| p == "|") {
            execute_pipeline(&parts, pipe_pos);
            continue;
        }

        // Now handle built-in commands that don't involve pipelines
        if input.starts_with("exit") {
            let exit_parts: Vec<&str> = input.split_whitespace().collect();
            let exit_code = if exit_parts.len() > 1 {
                exit_parts[1].parse::<i32>().unwrap_or(0)
            } else {
                0
            };
            std::process::exit(exit_code);
        }

        if input.starts_with("echo ") {
            let (cmd_args, stdout_file, stdout_append, stderr_file, _stderr_append) =
                parse_redirection(&parts[1..]); // Skip "echo" itself

            let output_text = cmd_args.join(" ");

            if let Some(file_path) = stdout_file {
                // Redirect stdout to file
                let file_result = if stdout_append {
                    std::fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open(&file_path)
                } else {
                    File::create(&file_path)
                };

                match file_result {
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

        // Check for output redirection
        let (cmd_parts, stdout_file, stdout_append, stderr_file, stderr_append) =
            parse_redirection(&parts);

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
                let file_result = if stdout_append {
                    std::fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open(file_path)
                } else {
                    File::create(file_path)
                };

                match file_result {
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
                let file_result = if stderr_append {
                    std::fs::OpenOptions::new()
                        .create(true)
                        .append(true)
                        .open(file_path)
                } else {
                    File::create(file_path)
                };

                match file_result {
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

fn parse_redirection(
    parts: &[String],
) -> (Vec<String>, Option<String>, bool, Option<String>, bool) {
    let mut cmd_parts = Vec::new();
    let mut stdout_file = None;
    let mut stdout_append = false;
    let mut stderr_file = None;
    let mut stderr_append = false;
    let mut i = 0;

    while i < parts.len() {
        let part = &parts[i];

        // Check for >> or 1>> (stdout append)
        if part == ">>" || part == "1>>" {
            if i + 1 < parts.len() {
                stdout_file = Some(parts[i + 1].clone());
                stdout_append = true;
                i += 2;
                continue;
            }
        } else if part == "2>>" {
            // stderr append
            if i + 1 < parts.len() {
                stderr_file = Some(parts[i + 1].clone());
                stderr_append = true;
                i += 2;
                continue;
            }
        } else if part == ">" || part == "1>" {
            // stdout overwrite
            if i + 1 < parts.len() {
                stdout_file = Some(parts[i + 1].clone());
                stdout_append = false;
                i += 2;
                continue;
            }
        } else if part == "2>" {
            // stderr overwrite
            if i + 1 < parts.len() {
                stderr_file = Some(parts[i + 1].clone());
                stderr_append = false;
                i += 2;
                continue;
            }
        } else if part.starts_with(">>") && !part.starts_with("2>>") {
            // Handle cases like >>file (no space)
            stdout_file = Some(part[2..].to_string());
            stdout_append = true;
            i += 1;
            continue;
        } else if part.starts_with("1>>") {
            // Handle cases like 1>>file (no space)
            stdout_file = Some(part[3..].to_string());
            stdout_append = true;
            i += 1;
            continue;
        } else if part.starts_with("2>>") {
            // Handle cases like 2>>file (no space)
            stderr_file = Some(part[3..].to_string());
            stderr_append = true;
            i += 1;
            continue;
        } else if part.starts_with(">") && !part.starts_with("2>") {
            // Handle cases like >file (no space)
            stdout_file = Some(part[1..].to_string());
            stdout_append = false;
            i += 1;
            continue;
        } else if part.starts_with("1>") {
            // Handle cases like 1>file (no space)
            stdout_file = Some(part[2..].to_string());
            stdout_append = false;
            i += 1;
            continue;
        } else if part.starts_with("2>") {
            // Handle cases like 2>file (no space)
            stderr_file = Some(part[2..].to_string());
            stderr_append = false;
            i += 1;
            continue;
        }

        cmd_parts.push(part.clone());
        i += 1;
    }

    (
        cmd_parts,
        stdout_file,
        stdout_append,
        stderr_file,
        stderr_append,
    )
}

fn is_builtin(cmd: &str) -> bool {
    matches!(cmd, "echo" | "exit" | "type" | "pwd" | "cd")
}

fn execute_builtin(
    cmd: &str,
    args: &[String],
    stdin: Option<std::process::ChildStdout>,
) -> Vec<u8> {
    use std::io::Read;

    let mut output = Vec::new();

    match cmd {
        "echo" => {
            let text = args.join(" ");
            output.extend_from_slice(text.as_bytes());
            output.push(b'\n');
        }
        "type" => {
            if let Some(arg) = args.first() {
                let result = if is_builtin(arg) {
                    format!("{} is a shell builtin\n", arg)
                } else if let Some(path) = find_in_path(arg) {
                    format!("{} is {}\n", arg, path)
                } else {
                    format!("{}: not found\n", arg)
                };
                output.extend_from_slice(result.as_bytes());
            }
        }
        "pwd" => {
            if let Ok(path) = env::current_dir() {
                output.extend_from_slice(path.display().to_string().as_bytes());
                output.push(b'\n');
            }
        }
        _ => {}
    }

    // Consume stdin if provided (to avoid broken pipe errors)
    if let Some(mut stdin_reader) = stdin {
        let mut _buffer = Vec::new();
        stdin_reader.read_to_end(&mut _buffer).ok();
    }

    output
}

fn execute_pipeline(parts: &[String], pipe_pos: usize) {
    use std::process::Stdio;

    let left_parts = &parts[..pipe_pos];
    let right_parts = &parts[pipe_pos + 1..];

    if left_parts.is_empty() || right_parts.is_empty() {
        return;
    }

    let left_cmd = left_parts[0].as_str();
    let right_cmd = right_parts[0].as_str();

    let left_is_builtin = is_builtin(left_cmd);
    let right_is_builtin = is_builtin(right_cmd);

    // Case 1: Both are built-ins
    if left_is_builtin && right_is_builtin {
        let _left_output = execute_builtin(left_cmd, &left_parts[1..].to_vec(), None);
        // Right built-in doesn't actually read from left (based on test description)
        let right_output = execute_builtin(right_cmd, &right_parts[1..].to_vec(), None);
        io::stdout().write_all(&right_output).unwrap();
        return;
    }

    // Case 2: Left is built-in, right is external
    if left_is_builtin && !right_is_builtin {
        let left_output = execute_builtin(left_cmd, &left_parts[1..].to_vec(), None);

        let Some(right_path) = find_in_path(right_cmd) else {
            eprintln!("{}: command not found", right_cmd);
            return;
        };

        let mut right_command = Command::new(right_path);
        right_command.arg0(right_cmd).args(&right_parts[1..]);
        right_command.stdin(Stdio::piped());

        let mut right_child = match right_command.spawn() {
            Ok(child) => child,
            Err(_) => {
                eprintln!("Failed to execute {}", right_cmd);
                return;
            }
        };

        // Write left's output to right's stdin
        if let Some(mut stdin) = right_child.stdin.take() {
            stdin.write_all(&left_output).ok();
        }

        match right_child.wait_with_output() {
            Ok(output) => {
                io::stdout().write_all(&output.stdout).unwrap();
                io::stderr().write_all(&output.stderr).unwrap();
            }
            Err(_) => {
                eprintln!("Failed to wait for {}", right_cmd);
            }
        }
        return;
    }

    // Case 3: Left is external, right is built-in
    if !left_is_builtin && right_is_builtin {
        let Some(left_path) = find_in_path(left_cmd) else {
            eprintln!("{}: command not found", left_cmd);
            return;
        };

        let mut left_command = Command::new(left_path);
        left_command.arg0(left_cmd).args(&left_parts[1..]);
        left_command.stdout(Stdio::piped());

        let mut left_child = match left_command.spawn() {
            Ok(child) => child,
            Err(_) => {
                eprintln!("Failed to execute {}", left_cmd);
                return;
            }
        };

        let left_stdout = left_child.stdout.take();
        let right_output = execute_builtin(right_cmd, &right_parts[1..].to_vec(), left_stdout);

        io::stdout().write_all(&right_output).unwrap();

        left_child.kill().ok();
        left_child.wait().ok();
        return;
    }

    // Case 4: Both are external commands (original implementation)
    let Some(left_path) = find_in_path(left_cmd) else {
        eprintln!("{}: command not found", left_cmd);
        return;
    };

    let Some(right_path) = find_in_path(right_cmd) else {
        eprintln!("{}: command not found", right_cmd);
        return;
    };

    // Create the first command (left side of pipe)
    let mut left_command = Command::new(left_path);
    left_command.arg0(left_cmd).args(&left_parts[1..]);
    left_command.stdout(Stdio::piped());

    // Spawn the first command
    let mut left_child = match left_command.spawn() {
        Ok(child) => child,
        Err(_) => {
            eprintln!("Failed to execute {}", left_cmd);
            return;
        }
    };

    // Create the second command (right side of pipe)
    let mut right_command = Command::new(right_path);
    right_command.arg0(right_cmd).args(&right_parts[1..]);

    // Connect left's stdout to right's stdin
    if let Some(left_stdout) = left_child.stdout.take() {
        right_command.stdin(Stdio::from(left_stdout));
    }

    // Spawn the second command
    let mut right_child = match right_command.spawn() {
        Ok(child) => child,
        Err(_) => {
            eprintln!("Failed to execute {}", right_cmd);
            left_child.kill().ok();
            return;
        }
    };

    // Wait for the right side to finish (it determines when pipeline completes)
    match right_child.wait() {
        Ok(status) => {
            // Once right side finishes, kill the left side if it's still running
            left_child.kill().ok();
            left_child.wait().ok();

            // Exit with the status of the right command
            if !status.success() {
                if let Some(code) = status.code() {
                    std::process::exit(code);
                }
            }
        }
        Err(_) => {
            eprintln!("Failed to wait for {}", right_cmd);
            left_child.kill().ok();
        }
    }
}
