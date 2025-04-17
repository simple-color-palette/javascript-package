/**
A color's components.
*/
export type ColorComponents = {
	red: number;
	green: number;
	blue: number;
	opacity: number;
};

/**
Options for creating a color.
*/
export type ColorOptions = {
	/**
	Name for the color.
	*/
	name?: string;

	/**
	Red component.
	*/
	red: number;

	/**
	Green component.
	*/
	green: number;

	/**
	Blue component.
	*/
	blue: number;

	/**
	Opacity value between 0 and 1.

	@default 1
	*/
	opacity?: number;

	/**
	Whether the component values are already in linear sRGB color space.

	If false (default), values are interpreted as non-linear (gamma-corrected) sRGB.

	@default false
	*/
	isLinear?: boolean;
};

/**
Represents a color in extended sRGB (non-linear) color space.
*/
export class Color {
	/**
	Name for the color.
	*/
	name?: string;

	/**
	Red component.

	Can be set.
	*/
	red: number;

	/**
	Green component.

	Can be set.
	*/
	green: number;

	/**
	Blue component.

	Can be set.
	*/
	blue: number;

	/**
	Opacity value between 0 and 1.

	Can be set.
	*/
	opacity: number;

	/**
	Color components in extended sRGB (non-linear) color space.
	*/
	readonly components: ColorComponents;

	/**
	Color components in extended sRGB (linear) color space.
	*/
	readonly linearComponents: ColorComponents;

	/**
	Creates a new color.

	Values are interpreted as extended sRGB (non-linear) by default.

	@note Values are rounded to 4 decimal places. Opacity is clamped to 0...1.
	*/
	constructor(options: ColorOptions);
}

/**
A collection of colors.

@example
```
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
*/
export class ColorPalette {
	/**
	Creates a new color.

	Values are interpreted as extended sRGB (non-linear) by default.

	@note Values are rounded to 4 decimal places. Opacity is clamped to 0...1.
	*/
	static createColor(options: ColorOptions): Color;

	/**
	Creates a new color palette from serialized data.
	*/
	static deserialize(data: string): ColorPalette;

	/**
	Name for the palette.
	*/
	name?: string;

	/**
	Colors in the palette.
	*/
	colors: Color[];

	/**
	Creates a new color palette.
	*/
	constructor(options?: {
		/**
		Name for the palette.
		*/
		name?: string;

		/**
		Array of colors in the palette.
		*/
		colors?: Color[];
	});

	/**
	Serializes the palette to a string.
	*/
	serialize(): string;
}
