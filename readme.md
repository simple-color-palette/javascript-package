# simple-color-palette

> A JavaScript implementation of the [Simple Color Palette](https://simplecolorpalette.com) format — a minimal JSON-based file format for defining color palettes

*Feedback wanted on the API.*

## Install

```sh
npm install simple-color-palette
```

## Usage

```js
import {ColorPalette} from 'simple-color-palette';

const redColor = ColorPalette.createColor({
	name: 'Red',
	red: 1,
	green: 0,
	blue: 0,
});

const greenColor = ColorPalette.createColor({
	name: 'Green',
	red: 0,
	green: 1,
	blue: 0,
});

const palette = new ColorPalette({
	name: 'Traffic Lights',
	colors: [
		redColor,
		greenColor
	],
});

console.log(redColor.components);
// {red: 1, green: 0, blue: 0, opacity: 1}

// Modify color components
redColor.red = 0.9;

// Serialize to string
const serialized = palette.serialize();

// Load from serialized data
const loadedPalette = ColorPalette.deserialize(serialized);
```

## API

See [types](index.d.ts).

## Note

The palette operates in non-linear sRGB, while the serialized version is in linear (gamma-corrected) sRGB for precision.
