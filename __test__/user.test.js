const request = require("supertest");
const bcryptjsOriginal = require("bcryptjs");

const mockUserSave = jest.fn();
const mockCurrentUserHashedPassword = "hashedOldPassword123";

const mockUserInstance = {
  id: "mockUserId123",
  _id: "mockUserId123",
  email: "test@example.com",
  isActive: true,
  password: mockCurrentUserHashedPassword,
  wallet: {
    balance: 100,
    _id: "mockWalletId",
  },
  save: mockUserSave,
};

const mockPaymentInstance = {
  _id: "mockPaymentId1",
  amount: 50,
  transactionType: "deposit",
  status: "completed",
  createdAt: new Date("2025-05-01T16:00:00.000Z").toISOString(),
};

const setupUserFindByIdMock = (
  returnValue = mockUserInstance,
  willReject = false
) => {
  const UserMock = require("../models/User");
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn(),
  };
  if (willReject) {
    mockQuery.populate.mockRejectedValue(returnValue);
  } else {
    mockQuery.populate.mockResolvedValue(returnValue);
  }
  UserMock.findById.mockReturnValue(mockQuery);
};

const setupPaymentFindMock = (
  returnValue = [mockPaymentInstance],
  willReject = false
) => {
  const PaymentMock = require("../models/Payment");
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn(),
  };
  if (willReject) {
    mockQuery.sort.mockRejectedValue(returnValue);
  } else {
    mockQuery.sort.mockResolvedValue(returnValue);
  }
  PaymentMock.find.mockReturnValue(mockQuery);
};

let app;

beforeAll(() => {
  jest.doMock("../models/User", () => ({
    findById: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockResolvedValue(mockUserInstance),
  }));

  jest.doMock("../models/Payment", () => ({
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([mockPaymentInstance]),
  }));

  jest.doMock("../middleware/authMiddleware", () =>
    jest.fn((req, res, next) => {
      req.user = mockUserInstance;
      next();
    })
  );

  jest.doMock("bcryptjs", () => ({
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  }));

  jest.doMock("../config/db", () => jest.fn());

  app = require("../testIndex");
});

afterAll(() => {
  jest.resetModules();
});

describe("GET /api/user/account", () => {
  let User, Payment;

  beforeAll(() => {
    User = require("../models/User");
    Payment = require("../models/Payment");
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setupUserFindByIdMock();
    setupPaymentFindMock();
    mockUserSave.mockResolvedValue(true);
  });

  test("should return 200 and user data/transactions on success", async () => {
    const response = await request(app).get("/api/user/account");
    expect(response.statusCode).toBe(200);
    expect(User.findById).toHaveBeenCalledWith(mockUserInstance.id);
    expect(Payment.find).toHaveBeenCalledWith({ user: mockUserInstance.id });
  });

  test("should return 404 if user not found in DB", async () => {
    setupUserFindByIdMock(null);
    const response = await request(app).get("/api/user/account");
    expect(response.statusCode).toBe(404);
    expect(User.findById).toHaveBeenCalledWith(mockUserInstance.id);
    expect(Payment.find).not.toHaveBeenCalled();
  });

  test("should return 500 on User.findById database error", async () => {
    const dbError = new Error("Database error during findById/populate");
    setupUserFindByIdMock(dbError, true);
    const response = await request(app).get("/api/user/account");
    expect(response.statusCode).toBe(500);
    expect(User.findById).toHaveBeenCalledWith(mockUserInstance.id);
    expect(Payment.find).not.toHaveBeenCalled();
  });

  test("should return 500 on Payment.find database error", async () => {
    const dbError = new Error("Database error during payment find/sort");
    setupPaymentFindMock(dbError, true);
    const response = await request(app).get("/api/user/account");
    expect(response.statusCode).toBe(500);
    expect(User.findById).toHaveBeenCalledWith(mockUserInstance.id);
    expect(Payment.find).toHaveBeenCalledWith({ user: mockUserInstance.id });
  });
});

describe("PUT /api/user/changepassword", () => {
  const validPasswordData = {
    oldPassword: "oldPassword123",
    newPassword: "newValidPassword1",
    newPasswordConfirmation: "newValidPassword1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const bcryptjsMock = require("bcryptjs");
    bcryptjsMock.compare.mockResolvedValue(true);
    bcryptjsMock.genSalt.mockResolvedValue("mockSalt10");
    bcryptjsMock.hash.mockResolvedValue("hashedNewValidPassword1");

    mockUserSave.mockResolvedValue(true);
  });

  test("should return 200 and success message on successful password change", async () => {
    const response = await request(app)
      .put("/api/user/changepassword")
      .send(validPasswordData);
    expect(response.statusCode).toBe(200);
    const bcryptjsMock = require("bcryptjs");
    expect(bcryptjsMock.compare).toHaveBeenCalledWith(
      validPasswordData.oldPassword,
      mockCurrentUserHashedPassword
    );
    expect(mockUserSave).toHaveBeenCalledTimes(1);
  });

  test.each([
    [
      "newPassword too short",
      {
        ...validPasswordData,
        newPassword: "short1",
        newPasswordConfirmation: "short1",
      },
      "Password must be at least 8 characters.",
    ],
  ])(
    "should return 400 if %s",
    async (description, invalidData, expectedErrorMessage) => {
      const response = await request(app)
        .put("/api/user/changepassword")
        .send(invalidData);
      expect(response.statusCode).toBe(400);
      const bcryptjsMock = require("bcryptjs");
      expect(bcryptjsMock.compare).not.toHaveBeenCalled();
    }
  );

  test("should return 500 if user.save fails", async () => {
    mockUserSave.mockRejectedValue(new Error("Database save error"));
    const response = await request(app)
      .put("/api/user/changepassword")
      .send(validPasswordData);
    expect(response.statusCode).toBe(500);
    expect(mockUserSave).toHaveBeenCalledTimes(1);
  });
});
