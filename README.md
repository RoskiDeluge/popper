```
 ____   ___  ____  ____  _____ ____  
|  _ \ / _ \|  _ \|  _ \| ____|  _ \ 
| |_) | | | | |_) | |_) |  _| | |_) |
|  __/| |_| |  __/|  __/| |___|  _ < 
|_|    \___/|_|   |_|   |_____|_| \_\
```

# popper

Agent friendly shell

## Installation

### Using Pre-built Binary

Download the latest release from the releases page and add it to your PATH.

### Building from Source

```bash
git clone https://github.com/RoskiDeluge/popper.git
cd popper
cargo build --release
```

The binary will be available at `target/release/popper`.

## Usage

Run the shell:

```bash
./target/release/popper
```

Or install it system-wide:

```bash
cargo install --path .
popper
```

## Development

### Prerequisites

- Rust (latest stable version)
- Cargo

### Building for Development

```bash
cargo build
```

### Running Tests

```bash
cargo test
```

### Running in Development Mode

```bash
cargo run
```
