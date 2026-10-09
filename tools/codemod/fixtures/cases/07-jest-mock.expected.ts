jest.mock("@texo-placeholder/ui", () => ({ Button: () => null }));
jest.doMock('@texo-placeholder/ui/theme');
const actual = jest.requireActual("@texo-placeholder/ui");
export { actual };
