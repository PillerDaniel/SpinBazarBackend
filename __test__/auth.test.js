const request = require("supertest");

const mockUserSave = jest.fn();
const mockCreatedUserInstance = {
  _id: "newMockUserId123",
  id: "newMockUserId123",
  userName: "testuser",
  email: "test@example.com",
  role: "user",
  save: mockUserSave,
};

const MOCK_ACCESS_TOKEN = "mock-access-token-123";
const MOCK_REFRESH_TOKEN = "mock-refresh-token-456";
let app;
let UserMockConstructor;
let jwtMock;
let bcryptjsMock;
let generateUniqueWalletMock;
let sendWelcomeEmailMock;

beforeAll(() => {
  UserMockConstructor = jest
    .fn()
    .mockImplementation(() => mockCreatedUserInstance);
  UserMockConstructor.findOne = jest.fn();
  jest.doMock("../models/User", () => UserMockConstructor);

  jest.doMock("bcryptjs", () => ({
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  }));

  jest.doMock("jsonwebtoken", () => ({
    sign: jest.fn(),
  }));

  generateUniqueWalletMock = jest.fn();
  jest.doMock("../config/generateUniqueWallet.js", () => ({
    generateUniqueWallet: generateUniqueWalletMock,
  }));

  sendWelcomeEmailMock = jest.fn();
  jest.doMock("../config/nodemailer.js", () => ({
    sendWelcomeEmail: sendWelcomeEmailMock,
  }));

  jest.doMock("../config/db", () => jest.fn());

  app = require("../testIndex");

  jwtMock = require("jsonwebtoken");
  bcryptjsMock = require("bcryptjs");
});

afterAll(() => {
  jest.resetModules();
});

describe("POST /api/auth/register", () => {
  const validRegisterData = {
    userName: "testuser",
    email: "test@example.com",
    password: "validPassword1",
    passwordConfirmation: "validPassword1",
    birthDate: "2000-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    UserMockConstructor.findOne.mockResolvedValue(null);
    mockUserSave.mockResolvedValue(true);
    bcryptjsMock.genSalt.mockResolvedValue("mockSalt10");
    bcryptjsMock.hash.mockResolvedValue("hashedPassword123");
    generateUniqueWalletMock.mockResolvedValue({ _id: "mockWalletId" });
    sendWelcomeEmailMock.mockResolvedValue(true);

    jwtMock.sign
      .mockReturnValueOnce(MOCK_ACCESS_TOKEN)
      .mockReturnValueOnce(MOCK_REFRESH_TOKEN);
  });

  describe("Validation Errors", () => {
    test.each([
      [
        "missing userName",
        { ...validRegisterData, userName: "" },
        "Username is required.",
      ],
      [
        "invalid email",
        { ...validRegisterData, email: "invalid-email" },
        "Invalid email.",
      ],
      [
        "password too short",
        {
          ...validRegisterData,
          password: "short1",
          passwordConfirmation: "short1",
        },
        "Password must be at least 8 characters.",
      ],
      [
        "password no uppercase",
        {
          ...validRegisterData,
          password: "nouppercase1",
          passwordConfirmation: "nouppercase1",
        },
        "Password must contain at least one uppercase letter.",
      ],
      [
        "password no number",
        {
          ...validRegisterData,
          password: "NoNumberHere",
          passwordConfirmation: "NoNumberHere",
        },
        "Password must contain at least one number.",
      ],
      [
        "missing birthDate",
        { ...validRegisterData, birthDate: "" },
        "Birthdate is required.",
      ],
    ])(
      "should return 400 for: %s",
      async (testName, invalidData, expectedMessage) => {
        const response = await request(app)
          .post("/api/auth/register")
          .send(invalidData);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty("errors");
        expect(
          response.body.errors.some((err) => err.msg === expectedMessage)
        ).toBe(true);
      }
    );
  });

  test("should return 400 if email is already in use", async () => {
    UserMockConstructor.findOne.mockResolvedValue({
      email: validRegisterData.email,
    });
    const response = await request(app)
      .post("/api/auth/register")
      .send(validRegisterData);
    expect(response.statusCode).toBe(400);
    expect(response.body.messageHU).toBe(
      "Felhasználónév vagy email már használatban van."
    );
  });

  test("should return 400 if passwords do not match", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validRegisterData,
        passwordConfirmation: "differentPassword1",
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.messageHU).toBe("A megadott jelszavak nem egyeznek.");
  });

  test("should return 400 if user is under 18", async () => {
    const today = new Date(Date.now());
    const underageBirthDate = `${today.getFullYear() - 17}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const response = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegisterData, birthDate: underageBirthDate });
    expect(response.statusCode).toBe(400);
    expect(response.body.messageHU).toBe(
      "A szolgáltatás csak 18 éven felüliek számára érhető el."
    );
  });

  test("should return 500 if User.findOne fails", async () => {
    UserMockConstructor.findOne.mockRejectedValue(new Error("DB error"));
    const response = await request(app)
      .post("/api/auth/register")
      .send(validRegisterData);
    expect(response.statusCode).toBe(500);
    expect(response.body.messageHU).toBe("Szerver hiba.");
  });

  test("should return 500 if bcryptjs.hash fails", async () => {
    bcryptjsMock.hash.mockRejectedValue(new Error("Hash error"));
    const response = await request(app)
      .post("/api/auth/register")
      .send(validRegisterData);
    expect(response.statusCode).toBe(500);
    expect(response.body.messageHU).toBe("Szerver hiba.");
  });

  test("should return 500 if user.save fails", async () => {
    mockUserSave.mockRejectedValue(new Error("DB save error"));
    const response = await request(app)
      .post("/api/auth/register")
      .send(validRegisterData);
    expect(response.statusCode).toBe(500);
    expect(response.body.messageHU).toBe("Szerver hiba.");
  });
});
