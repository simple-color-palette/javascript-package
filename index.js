const roundToFourDecimals = number => {
	const multiplier = 10_000;
	return Math.round(number * multiplier) / multiplier;
};

const sRGBToLinear = srgb => {
	if (srgb <= 0.040_45) {
		return srgb / 12.92;
	}

	return ((srgb + 0.055) / 1.055) ** 2.4;
};

const linearToSRGB = linear => {
	if (linear <= 0.003_130_8) {
		return linear * 12.92;
	}

	return (((linear ** (1 / 2.4)) * 1.055) - 0.055);
};

const clampOpacity = value => Math.max(0, Math.min(1, value));

const validateColorComponent = color => {
	if (!Array.isArray(color.components)) {
		throw new TypeError('Components must be an array');
	}

	if (color.components.length !== 3 && color.components.length !== 4) {
		throw new Error('Components must have 3 or 4 values');
	}

	for (const component of color.components) {
		if (typeof component !== 'number' || component < 0) {
			throw new Error('Component values must be numbers');
		}
	}
};

const validatePalette = palette => {
	if (!Array.isArray(palette.colors)) {
		throw new TypeError('Colors must be an array');
	}

	for (const color of palette.colors) {
		validateColorComponent(color);
	}
};

const validateComponent = (value, name) => {
	if (typeof value !== 'number') {
		throw new TypeError(`${name} component must be a number`);
	}
};

export class Color {
	name;
	#linearRed;
	#linearGreen;
	#linearBlue;
	#opacity;

	constructor(
		{
			name,
			red,
			green,
			blue,
			opacity = 1,
			isLinear = false,
		} = {},
	) {
		validateComponent(red, 'Red');
		validateComponent(green, 'Green');
		validateComponent(blue, 'Blue');
		validateComponent(opacity, 'Opacity');

		this.name = name;
		this.#linearRed = roundToFourDecimals(isLinear ? red : sRGBToLinear(red));
		this.#linearGreen = roundToFourDecimals(isLinear ? green : sRGBToLinear(green));
		this.#linearBlue = roundToFourDecimals(isLinear ? blue : sRGBToLinear(blue));
		this.#opacity = roundToFourDecimals(clampOpacity(opacity));
	}

	static fromHexString(hex) {
		const string = hex.trim();
		const withoutHash = string.startsWith('#') ? string.slice(1) : string;

		// Convert 3/4 character hex to 6/8 character hex
		const expanded = (withoutHash.length === 3 || withoutHash.length === 4)
			? [...withoutHash].map(x => x + x).join('')
			: withoutHash;

		if (!/^[\da-f]{6}([\da-f]{2})?$/i.test(expanded)) {
			throw new Error('Invalid hex color format');
		}

		const value = Number.parseInt(expanded, 16);
		return this.fromHexNumber(value);
	}

	static fromHexNumber(hex) {
		if (!Number.isInteger(hex) || hex < 0) {
			throw new Error('Invalid hex value');
		}

		let red;
		let green;
		let blue;
		let opacity = 1;

		/* eslint-disable no-bitwise */
		if (hex <= 0xF_FF) { // 12-bit RGB
			red = ((hex >> 8) & 0xF) / 15;
			green = ((hex >> 4) & 0xF) / 15;
			blue = (hex & 0xF) / 15;
		} else if (hex <= 0xFF_FF) { // 16-bit RGBA
			red = ((hex >> 12) & 0xF) / 15;
			green = ((hex >> 8) & 0xF) / 15;
			blue = ((hex >> 4) & 0xF) / 15;
			opacity = (hex & 0xF) / 15;
		} else if (hex <= 0xFF_FF_FF) { // 24-bit RGB
			red = ((hex >> 16) & 0xFF) / 255;
			green = ((hex >> 8) & 0xFF) / 255;
			blue = (hex & 0xFF) / 255;
		} else if (hex <= 0xFF_FF_FF_FF) { // 32-bit RGBA
			red = ((hex >> 24) & 0xFF) / 255;
			green = ((hex >> 16) & 0xFF) / 255;
			blue = ((hex >> 8) & 0xFF) / 255;
			opacity = (hex & 0xFF) / 255;
		} else {
			throw new Error('Invalid hex value');
		}
		/* eslint-enable no-bitwise */

		return new Color({
			red, green, blue, opacity,
		});
	}

	get red() {
		return linearToSRGB(this.#linearRed);
	}

	// We don't round in setters to maintain precision during calculations (like `red += 0.1`).
	// Rounding only happens during initialization and serialization.
	set red(value) {
		if (typeof value !== 'number') {
			throw new TypeError('Red component must be a number');
		}

		this.#linearRed = sRGBToLinear(value);
	}

	get green() {
		return linearToSRGB(this.#linearGreen);
	}

	set green(value) {
		if (typeof value !== 'number') {
			throw new TypeError('Green component must be a number');
		}

		this.#linearGreen = sRGBToLinear(value);
	}

	get blue() {
		return linearToSRGB(this.#linearBlue);
	}

	set blue(value) {
		if (typeof value !== 'number') {
			throw new TypeError('Blue component must be a number');
		}

		this.#linearBlue = sRGBToLinear(value);
	}

	get opacity() {
		return this.#opacity;
	}

	set opacity(value) {
		if (typeof value !== 'number') {
			throw new TypeError('Opacity must be a number');
		}

		this.#opacity = clampOpacity(value);
	}

	get components() {
		return {
			red: this.red,
			green: this.green,
			blue: this.blue,
			opacity: this.opacity,
		};
	}

	get linearComponents() {
		return {
			red: this.#linearRed,
			green: this.#linearGreen,
			blue: this.#linearBlue,
			opacity: this.#opacity,
		};
	}

	toJSON() {
		const components = [
			roundToFourDecimals(this.#linearRed),
			roundToFourDecimals(this.#linearGreen),
			roundToFourDecimals(this.#linearBlue),
		];

		if (this.#opacity !== 1) {
			components.push(roundToFourDecimals(this.#opacity));
		}

		const result = {components};
		if (this.name) {
			result.name = this.name;
		}

		return result;
	}
}

export class ColorPalette {
	name;
	colors;

	constructor(
		{
			colors = [],
			name,
		} = {},
	) {
		if (!Array.isArray(colors)) {
			throw new TypeError('The `colors` must be an array');
		}

		for (const color of colors) {
			if (!(color instanceof Color)) {
				throw new TypeError('Each color must be an instance of Color');
			}
		}

		this.name = name;
		this.colors = [...colors];
	}

	static createColor(options) {
		return new Color(options);
	}

	static deserialize(data) {
		const parsed = JSON.parse(data);
		validatePalette(parsed);

		const colors = parsed.colors.map(color => {
			const [red, green, blue, opacity = 1] = color.components;

			return new Color({
				name: color.name,
				red: roundToFourDecimals(red),
				green: roundToFourDecimals(green),
				blue: roundToFourDecimals(blue),
				opacity: roundToFourDecimals(opacity),
				isLinear: true,
			});
		});

		return new ColorPalette({colors, name: parsed.name});
	}

	serialize() {
		return JSON.stringify(this, undefined, '\t');
	}

	toJSON() {
		return {
			...(this.name && {name: this.name}),
			colors: this.colors,
		};
	}
}
