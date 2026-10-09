jest.mock("@personal-library/react-native-components", () => ({ Button: () => null }));
jest.doMock('@personal-library/react-native-components/theme');
const actual = jest.requireActual("@personal-library/react-native-components");
export { actual };
