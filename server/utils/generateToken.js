const jwt = require("jsonwebtoken");

module.exports = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
