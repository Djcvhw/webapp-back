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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const sequelize = new sequelize_1.Sequelize(require("../config/config.json")["development"]);
const User = sequelize.define("User", {
    balance: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
});
User.sync().then(() => {
    User.findOrCreate({
        where: {
            balance: 10000,
        },
    });
});
app.post("/update-balance", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.body.userId;
    const amount = req.body.amount;
    try {
        const transaction = yield sequelize.transaction({
            isolationLevel: sequelize_1.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
        });
        try {
            const [affectedRows] = yield User.update({ balance: sequelize_1.Sequelize.literal(`"balance" - ${amount}`) }, {
                where: { id: userId, balance: { [sequelize_1.Op.gte]: amount } },
                transaction: transaction,
            });
            if (affectedRows === 0) {
                yield transaction.rollback();
                return res.status(400).json({ error: "Insufficient funds on balance" });
            }
            yield transaction.commit();
            return res.status(200).json({ message: "Balance updated successfully" });
        }
        catch (error) {
            yield transaction.rollback();
            console.error("Ошибка в транзакции:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
    catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
