use std::env;
#[allow(unused_imports)]
use std::io::{self, Write};
use std::os::unix::fs::PermissionsExt;
use std::os::unix::process::CommandExt;
use std::path::Path;
use std::process::Command;

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
            let output = &input[5..]; // Skip "echo "
            println!("{}", output);
            continue;
        }

        if input == "pwd" {
            match env::current_dir() {
                Ok(path) => println!("{}", path.display()),
                Err(_) => eprintln!("pwd: error getting current directory"),
            }
            continue;
        }

        if input.starts_with("type ") {
            let cmd = &input[5..]; // Skip "type "
            if cmd == "echo" || cmd == "exit" || cmd == "type" || cmd == "pwd" {
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
        let parts: Vec<&str> = input.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let cmd = parts[0];

        // Check if it's a builtin that doesn't need arguments
        if cmd == "exit" || cmd == "echo" || cmd == "type" || cmd == "pwd" {
            println!("{}: command not found", input);
            continue;
        }

        // Search for executable in PATH
        if let Some(path) = find_in_path(cmd) {
            let args = &parts[1..];

            let output = Command::new(path).arg0(cmd).args(args).output();

            match output {
                Ok(output) => {
                    io::stdout().write_all(&output.stdout).unwrap();
                    io::stderr().write_all(&output.stderr).unwrap();
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
