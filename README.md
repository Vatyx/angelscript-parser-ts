<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/Vatyx/angelscript-parser-ts">
    <img src="https://www.angelcode.com/angelscript/sdk/docs/manual/aslogo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">angelscript-parser-ts</h3>

  <p align="center">
    A TypeScript implementation of AngelScript parser.
    <br />
    <br />
    <a href="https://github.com/Vatyx/angelscript-parser-ts/issues">Report Bug</a>
    ·
    <a href="https://github.com/Vatyx/angelscript-parser-ts/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
TABLE OF CONTENTS
- [About The Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
- [Usage](#usage)
  - [Import](#import)
  - [Parse string into AST](#parse-string-into-ast)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

<!-- ABOUT THE PROJECT -->
## About The Project

<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Install from NPM registry
  ```sh
  npm install angelscript-parser-ts
  ```

-. Build from repository
1. Clone the repo
   ```sh
   git clone https://github.com/Vatyx/angelscript-parser-ts.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
2. Build
   ```sh
   npm run build
   ```

<!-- USAGE EXAMPLES -->
## Usage

### Import

1. CommonJS
```ts
const Parser = require("angelscript-parser-ts").Parser;
```

2. ES6
```ts
import { Parser } from "angelscript-parser-ts";
```

### Parse string into AST

```ts
const script = `foo bar() {}`;

const parser = new Parser(script);
const ast = parser.ParseScript();
```

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Vatyx - [https://github.com/Vatyx](https://github.com/Vatyx) 

Project Link: [https://github.com/Vatyx/angelscript-parser-ts](https://github.com/Vatyx/angelscript-parser-ts)