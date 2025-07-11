"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function fixDuplicateRfidUids() {
    return __awaiter(this, void 0, void 0, function () {
        var usersWithRfid, rfidGroups_1, duplicates, _i, duplicates_1, _a, rfidUid, users, keepUser, removeUsers, _b, removeUsers_1, user, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, 9, 11]);
                    console.log('Checking for duplicate RFID UIDs...');
                    return [4 /*yield*/, prisma.user.findMany({
                            where: {
                                rfidUid: { not: null }
                            },
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                rfidUid: true,
                                updatedAt: true
                            },
                            orderBy: {
                                updatedAt: 'desc'
                            }
                        })];
                case 1:
                    usersWithRfid = _c.sent();
                    console.log("Found ".concat(usersWithRfid.length, " users with RFID UIDs"));
                    rfidGroups_1 = {};
                    usersWithRfid.forEach(function (user) {
                        if (!rfidGroups_1[user.rfidUid]) {
                            rfidGroups_1[user.rfidUid] = [];
                        }
                        rfidGroups_1[user.rfidUid].push(user);
                    });
                    duplicates = Object.entries(rfidGroups_1).filter(function (_a) {
                        var rfidUid = _a[0], users = _a[1];
                        return users.length > 1;
                    });
                    if (duplicates.length === 0) {
                        console.log('No duplicate RFID UIDs found!');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(duplicates.length, " duplicate RFID UIDs:"));
                    _i = 0, duplicates_1 = duplicates;
                    _c.label = 2;
                case 2:
                    if (!(_i < duplicates_1.length)) return [3 /*break*/, 7];
                    _a = duplicates_1[_i], rfidUid = _a[0], users = _a[1];
                    console.log("\nRFID UID: ".concat(rfidUid));
                    console.log('Users with this RFID:');
                    users.forEach(function (user) {
                        console.log("  - ".concat(user.name, " (").concat(user.email, ") - Updated: ").concat(user.updatedAt));
                    });
                    keepUser = users[0];
                    removeUsers = users.slice(1);
                    console.log("Keeping: ".concat(keepUser.name, " (").concat(keepUser.email, ")"));
                    console.log("Removing RFID from: ".concat(removeUsers.length, " users"));
                    _b = 0, removeUsers_1 = removeUsers;
                    _c.label = 3;
                case 3:
                    if (!(_b < removeUsers_1.length)) return [3 /*break*/, 6];
                    user = removeUsers_1[_b];
                    return [4 /*yield*/, prisma.user.update({
                            where: { id: user.id },
                            data: { rfidUid: null }
                        })];
                case 4:
                    _c.sent();
                    console.log("  - Removed RFID from ".concat(user.name));
                    _c.label = 5;
                case 5:
                    _b++;
                    return [3 /*break*/, 3];
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    console.log('\nDuplicate RFID UIDs fixed successfully!');
                    return [3 /*break*/, 11];
                case 8:
                    error_1 = _c.sent();
                    console.error('Error fixing duplicate RFID UIDs:', error_1);
                    return [3 /*break*/, 11];
                case 9: return [4 /*yield*/, prisma.$disconnect()];
                case 10:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
fixDuplicateRfidUids();
