#[allow(unused_imports)]
use std::io::{self, Write};

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

        println!("{}: command not found", input);
    }
}
