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
        let builtins = ["echo ", "exit ", "type ", "pwd", "cd ", "history"];

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

    // Track command history
    let mut command_history: Vec<String> = Vec::new();

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

        // Add non-empty commands to history
        if !input.is_empty() {
            command_history.push(input.to_string());
            // Also add to rustyline's history for up/down arrow navigation
            rl.add_history_entry(input).ok();
        }

        // Parse input first to check for pipelines
        let parts = parse_arguments(input);
        if parts.is_empty() {
            continue;
        }

        // Check for pipeline first (before handling built-ins)
        if parts.iter().any(|p| p == "|") {
            execute_pipeline(&parts);
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
            if cmd == "echo"
                || cmd == "exit"
                || cmd == "type"
                || cmd == "pwd"
                || cmd == "cd"
                || cmd == "history"
            {
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

        if input == "history" || input.starts_with("history ") {
            let limit = if input == "history" {
                None
            } else {
                let n_str = &input[8..]; // Skip "history "
                n_str.parse::<usize>().ok()
            };

            let entries_to_show = if let Some(n) = limit {
                // Show last n entries
                let start_index = command_history.len().saturating_sub(n);
                &command_history[start_index..]
            } else {
                // Show all entries
                &command_history[..]
            };

            let start_number = command_history.len() - entries_to_show.len() + 1;
            for (index, cmd) in entries_to_show.iter().enumerate() {
                println!("{:5}  {}", start_number + index, cmd);
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
    matches!(cmd, "echo" | "exit" | "type" | "pwd" | "cd" | "history")
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

fn execute_pipeline(parts: &[String]) {
    use std::process::Stdio;

    // Split commands by pipe operator
    let mut commands: Vec<Vec<String>> = Vec::new();
    let mut current_cmd = Vec::new();

    for part in parts {
        if part == "|" {
            if !current_cmd.is_empty() {
                commands.push(current_cmd.clone());
                current_cmd.clear();
            }
        } else {
            current_cmd.push(part.clone());
        }
    }
    if !current_cmd.is_empty() {
        commands.push(current_cmd);
    }

    if commands.is_empty() {
        return;
    }

    // Track child processes
    let mut children: Vec<std::process::Child> = Vec::new();
    let mut prev_stdout: Option<std::process::ChildStdout> = None;

    for (i, cmd_parts) in commands.iter().enumerate() {
        if cmd_parts.is_empty() {
            continue;
        }

        let cmd = cmd_parts[0].as_str();
        let args = &cmd_parts[1..];
        let is_last = i == commands.len() - 1;

        if is_builtin(cmd) {
            // Handle built-in command
            let output = execute_builtin(cmd, args, prev_stdout.take());

            if is_last {
                // Last command: write to stdout
                io::stdout().write_all(&output).unwrap();
            } else {
                // Not last: need to create a pipe for next command
                // Use 'cat' as a pipe helper to convert Vec<u8> to ChildStdout
                let mut child_cmd = Command::new("cat");
                child_cmd.stdin(Stdio::piped());
                child_cmd.stdout(Stdio::piped());

                let mut child = match child_cmd.spawn() {
                    Ok(c) => c,
                    Err(_) => {
                        eprintln!("Failed to create pipe for builtin");
                        return;
                    }
                };

                // Write builtin output to cat's stdin
                if let Some(mut stdin) = child.stdin.take() {
                    stdin.write_all(&output).ok();
                }

                prev_stdout = child.stdout.take();
                children.push(child);
            }
        } else {
            // Handle external command
            let Some(cmd_path) = find_in_path(cmd) else {
                eprintln!("{}: command not found", cmd);
                // Kill previous processes
                for mut child in children {
                    child.kill().ok();
                }
                return;
            };

            let mut command = Command::new(cmd_path);
            command.arg0(cmd).args(args);

            // Setup stdin from previous command
            if let Some(stdout) = prev_stdout.take() {
                command.stdin(Stdio::from(stdout));
            }

            // Setup stdout for next command or terminal
            if !is_last {
                command.stdout(Stdio::piped());
            }

            let mut child = match command.spawn() {
                Ok(c) => c,
                Err(_) => {
                    eprintln!("Failed to execute {}", cmd);
                    // Kill previous processes
                    for mut child in children {
                        child.kill().ok();
                    }
                    return;
                }
            };

            // Save stdout for next command if not last
            if !is_last {
                prev_stdout = child.stdout.take();
            }

            children.push(child);
        }
    }

    // Wait for all children to finish
    for mut child in children {
        child.wait().ok();
    }
}
