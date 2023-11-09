import express, { Request, Response } from "express";
import { Sequelize, DataTypes, Transaction, Op } from "sequelize";

const app = express();

app.use(express.json());

const sequelize = new Sequelize(
  require("../config/config.json")["development"]
);

const User = sequelize.define("User", {
  balance: {
    type: DataTypes.INTEGER,
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

app.post("/update-balance", async (req: Request, res: Response) => {
  const userId = req.body.userId;
  const amount = req.body.amount;
  try {
    const transaction = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      const [affectedRows] = await User.update(
        { balance: Sequelize.literal(`"balance" - ${amount}`) },
        {
          where: { id: userId, balance: { [Op.gte]: amount } },
          transaction: transaction,
        }
      );

      if (affectedRows === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: "Insufficient funds on balance" });
      }

      await transaction.commit();

      return res.status(200).json({ message: "Balance updated successfully" });
    } catch (error) {
      await transaction.rollback();
      console.error("Ошибка в транзакции:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
