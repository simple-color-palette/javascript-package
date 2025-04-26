import test from 'ava';
import {ColorPalette, Color} from './index.js';

// --- Helpers ---

function round(value, decimals = 2) {
	return Math.round(value * (10 ** decimals)) / (10 ** decimals);
}

function assertColorComponents(t, color, expected, decimals = 2) {
	t.is(round(color.red, decimals), expected.red);
	t.is(round(color.green, decimals), expected.green);
	t.is(round(color.blue, decimals), expected.blue);
	if (expected.opacity !== undefined) {
		t.is(round(color.opacity, decimals), expected.opacity);
	}
}

// --- Tests ---

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
	assertColorComponents(t, color, {red: 0.5, green: 0.7, blue: 0.3});
});

test('color creation with linear values', t => {
	const color = new Color({
		red: 0.5,
		green: 0.7,
		blue: 0.3,
		isLinear: true,
	});
	const linear = color.linearComponents;
	assertColorComponents(t, linear, {red: 0.5, green: 0.7, blue: 0.3});
});

test('color component validation', t => {
	t.throws(() => {
		// eslint-disable-next-line no-new
		new Color({red: 'invalid', green: 0, blue: 0});
	}, {message: /must be a number/});
});

test('color opacity handling', t => {
	const color = new Color({red: 0, green: 0, blue: 0});

	color.opacity = 1.5;
	t.is(color.opacity, 1);

	color.opacity = -0.5;
	t.is(color.opacity, 0);

	t.throws(() => {
		color.opacity = 'invalid';
	}, {message: /must be a number/});
});

test('palette creation and validation', t => {
	const red = new Color({red: 1, green: 0, blue: 0});
	const green = new Color({red: 0, green: 1, blue: 0});
	const palette = new ColorPalette({colors: [red, green], name: 'Test'});
	t.is(palette.colors.length, 2);
	t.is(palette.name, 'Test');

	t.throws(() => {
		// eslint-disable-next-line no-new
		new ColorPalette({colors: [{}]});
	}, {message: /must be an instance of Color/});
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

	t.is(deserialized.name, original.name);
	t.is(deserialized.colors.length, original.colors.length);

	for (let i = 0; i < original.colors.length; i++) {
		const originalColor = original.colors[i];
		const deserializedColor = deserialized.colors[i];
		t.is(deserializedColor.name, originalColor.name);
		t.is(deserializedColor.opacity, originalColor.opacity);
		assertColorComponents(
			t,
			deserializedColor.linearComponents,
			originalColor.linearComponents,
			4,
		);
	}
});

test('deserialization validation', t => {
	t.throws(() => {
		ColorPalette.deserialize('/');
	}, {message: /not valid JSON/});

	t.throws(() => {
		ColorPalette.deserialize('{}');
	}, {message: 'Colors must be an array'});

	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: 'invalid'}],
		}));
	}, {message: 'Components must be an array'});

	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: [1, 2]}],
		}));
	}, {message: 'Components must have 3 or 4 values'});

	t.throws(() => {
		ColorPalette.deserialize(JSON.stringify({
			colors: [{components: [-1, 0, 0]}],
		}));
	}, {message: 'Component values must be numbers'});
});

test('color component modification', t => {
	const color = new Color({red: 0.5, green: 0.5, blue: 0.5});
	color.red = 1;
	color.green = 0;
	color.blue = 0;
	assertColorComponents(t, color, {red: 1, green: 0, blue: 0});

	t.throws(() => {
		color.green = 'invalid';
	}, {message: /number/});
});

test('precision rounding', t => {
	const color = new Color({
		red: 0.123_45,
		green: 0.1235,
		blue: 0.123_44,
		opacity: 0.123_49,
		isLinear: true,
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

	// eslint-disable-next-line unicorn/prefer-structured-clone
	const parsed = JSON.parse(JSON.stringify(color));

	t.deepEqual(parsed.components, [0.1235, 0.1235, 0.1234, 0.1235]);
});

// --- Parameterized hex string and number tests ---

const hexStringCases = [
	{hexString: '#FF0000', expected: {red: 1, green: 0, blue: 0}},
	{hexString: 'F00', expected: {red: 1, green: 0, blue: 0}},
	{
		hexString: '#FF000080', expected: {
			red: 1, green: 0, blue: 0, opacity: 0.5,
		},
	},
	{
		hexString: 'F008', expected: {
			red: 1, green: 0, blue: 0, opacity: 0.53,
		},
	},
];

for (const {hexString, expected} of hexStringCases) {
	test(`hex string initialization: ${hexString}`, t => {
		const color = Color.fromHexString(hexString);
		assertColorComponents(t, color, expected);
	});
}

test('hex string initialization: invalid formats', t => {
	const invalidHexStrings = ['', '#', '#F', '#FF', '#FFFFF', '#FFFFFFF', '#GG0000'];
	for (const invalidHexString of invalidHexStrings) {
		t.throws(() => {
			Color.fromHexString(invalidHexString);
		}, {message: /Invalid hex color format/});
	}
});

const hexNumberCases = [
	{hexNumber: 0xFF_00_00, expected: {red: 1, green: 0, blue: 0}},
	{hexNumber: 0xF_00, expected: {red: 1, green: 0, blue: 0}},
	{hexNumber: 0x12_34_56, expected: {red: 0.0702, green: 0.2038, blue: 0.3373}, decimals: 4},
	{
		hexNumber: 0xFF_00_00_80, expected: {
			red: 1, green: 0, blue: 0, opacity: 0.502,
		}, decimals: 4,
	},
];

for (const {hexNumber, expected, decimals = 2} of hexNumberCases) {
	test(`hex number initialization: ${hexNumber.toString(16)}`, t => {
		const color = Color.fromHexNumber(hexNumber);
		assertColorComponents(t, color, expected, decimals);
	});
}

test('hex number initialization: invalid values', t => {
	t.throws(() => {
		Color.fromHexNumber(-1);
	}, {message: /Invalid hex value/});

	t.throws(() => {
		Color.fromHexNumber(0x1_00_00_00_00);
	}, {message: /Invalid hex value/});
});
