# PNG Converter

## Overview

PNG Converter is a tool designed to convert PNG images to other formats such as JPG and WebP. It provides options to customize the conversion process, including setting the quality and maximum dimensions of the output images.

## Features

- Convert PNG images to JPG or WebP formats.
- Customize image quality and dimensions.
- Option to delete original files after conversion.
- Preserve file attributes of the original images.
- Continue processing even if an error occurs.
- Currently configured to work as a win-x64 executable.

## Installation

To install the dependencies for this project, use the following command:

```sh
pnpm install --shamefully-hoist
```

## Usage

### Build

```shell
pnpm run package
```

This should create a `bin` directory with the executable file. Pass either a config file or a directory containing PNG images to the executable to start the conversion process.

## Configuration

The application uses a configuration file named png-converter.json to specify options for the conversion process. The configuration file should be placed in the directory where the images are located.

```json
{
  "directory": "path/to/images",
  "deleteOriginal": false,
  "preserveAttributes": true,
  "careful": false,
  "deep": false,
  "imageOptions": {
    "type": "webp",
    "quality": 90,
    "maxWidth": null,
    "maxHeight": null
  }
}
```
