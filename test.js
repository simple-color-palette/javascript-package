import test from 'ava';
import {ColorPalette, Color} from './index.js';

test('color creation and component access', t => {
	const color = new Color({
		red: 0.5,
		green: 0.7,
		blue: 0.3,
		opacity: 0.8,
		name: 'Test',
	});

	t.is(color.name, 'Test');
	t.is(color.opacity, 0.8);

	// Test that sRGB values are preserved
	t.is(Math.round(color.red * 100) / 100, 0.5);
	t.is(Math.round(color.green * 100) / 100, 0.7);
	t.is(Math.round(color.blue * 100) / 100, 0.3);
});

test('color creation with linear values', t => {
	const color = new Color({
		red: 0.5,
		green: 0.7,
		blue: 0.3,
		isLinear: true,
	});

	// Linear values should be preserved in linearComponents
	const linear = color.linearComponents;
	t.is(linear.red, 0.5);
	t.is(linear.green, 0.7);
	t.is(linear.blue, 0.3);
});

test('color component validation', t => {
	// Non-numeric values
	t.throws(() => {
		// eslint-disable-next-line no-new
		new Color({
			red: 'invalid',
			green: 0,
			blue: 0,
		});
	}, {
		message: /must be a number/,
	});
});

test('color opacity handling', t => {
	const color = new Color({
		red: 0,
		green: 0,
		blue: 0,
	});

	// Test opacity clamping
	color.opacity = 1.5;
	t.is(color.opacity, 1);

	color.opacity = -0.5;
	t.is(color.opacity, 0);

	// Test opacity validation
	t.throws(() => {
		color.opacity = 'invalid';
	}, {message: /must be a number/});
});

test('palette creation and validation', t => {
	const red = new Color({red: 1, green: 0, blue: 0});
	const green = new Color({red: 0, green: 1, blue: 0});

	// Valid creation
	const palette = new ColorPalette({
		colors: [red, green],
		name: 'Test',
	});
	t.is(palette.colors.length, 2);
	t.is(palette.name, 'Test');

	// Invalid color array
	t.throws(() => new ColorPalette({
		colors: [{}],
	}), {message: /must be an instance of Color/});
});

test('serialization roundtrip', t => {
	const original = new ColorPalette({
		colors: [
			new Color({
				red: 1, green: 0, blue: 0, name: 'Red',
			}),
			new Color({
				red: 0, green: 1, blue: 0, opacity: 0.5, name: 'Green',
			}),
		],
		name: 'Test',
	});

	const serialized = original.serialize();
	const deserialized = ColorPalette.deserialize(serialized);

	// Check structure
	t.is(deserialized.name, original.name);
	t.is(deserialized.colors.length, original.colors.length);

	// Check color values are preserved
	for (let i = 0; i < original.colors.length; i++) {
		const origColor = original.colors[i];
		const deserColor = deserialized.colors[i];

		t.is(deserColor.name, origColor.name);
		t.is(deserColor.opacity, origColor.opacity);

		// Check linear components are preserved
		const origLinear = origColor.linearComponents;
		const deserLinear = deserColor.linearComponents;
		t.is(deserLinear.red, origLinear.red);
		t.is(deserLinear.green, origLinear.green);
		t.is(deserLinear.blue, origLinear.blue);
	}
});

test('deserialization validation', t => {
	// Invalid JSON
	t.throws(() => {
		ColorPalette.deserialize('/');
	}, {
		message: /not valid JSON/,
	});

	// Missing colors array
	t.throws(() => {
		ColorPalette.deserialize('{}');
	}, {
		message: 'Colors must be an array',
	});

	// Invalid color components
	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: 'invalid'}],
		}));
	}, {
		message: 'Components must be an array',
	});

	// Wrong number of components
	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: [1, 2]}],
		}));
	}, {
		message: 'Components must have 3 or 4 values',
	});

	// Negative components
	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: [-1, 0, 0]}],
		}));
	}, {
		message: 'Component values must be numbers',
	});
});

test('color component modification', t => {
	const color = new Color({red: 0.5, green: 0.5, blue: 0.5});

	// Modify sRGB values
	color.red = 1;
	color.green = 0;
	color.blue = 0;

	// Check both sRGB and linear values are updated correctly
	const srgb = color.components;
	t.is(Math.round(srgb.red * 100) / 100, 1);
	t.is(Math.round(srgb.green * 100) / 100, 0);
	t.is(Math.round(srgb.blue * 100) / 100, 0);

	t.throws(() => {
		color.green = 'invalid';
	}, {message: /number/});
});

test('precision rounding', t => {
	const color = new Color({
		red: 0.123_45, // Should round to 0.1235
		green: 0.1235, // Should round to 0.1235 (banker's rounding)
		blue: 0.123_44, // Should round to 0.1234
		opacity: 0.123_49, // Should round to 0.1235
		isLinear: true, // Use linear values directly to test rounding
	});

	const linear = color.linearComponents;
	t.is(linear.red, 0.1235);
	t.is(linear.green, 0.1235);
	t.is(linear.blue, 0.1234);
	t.is(linear.opacity, 0.1235);
});

test('precision roundtrip', t => {
	const color = new Color({
		red: 0.123_45,
		green: 0.1235,
		blue: 0.123_44,
		opacity: 0.123_49,
		isLinear: true,
	});

	// Test serialization maintains precision
	const serialized = JSON.stringify(color);
	const parsed = JSON.parse(serialized);

	t.deepEqual(parsed.components, [0.1235, 0.1235, 0.1234, 0.1235]);
});
