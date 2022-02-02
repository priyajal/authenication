const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeDbAndServer();

app.post("/register", async (request, response) => {
  try {
    const { username, password, gender, location, name } = request.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `
    select
    username
    from
    user
    where username = '${username}'
    
    `;
    const dbUser = await db.get(selectUserQuery);

    if (dbUser === undefined) {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const createNewUserQuery = `
        insert into user(username,name,password,gender,location)
        values('${username}','${name}','${hashedPassword}','${gender}','${location}')
        `;
        await db.run(createNewUserQuery);
        response.status(200);
        response.send("User created successfully");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(e.message);
  }
});

app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;

    const getUsernameQuery = `
  select
  *
  from user
  where username = '${username}'
  `;
    const dbUser = await db.get(getUsernameQuery);

    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

      if (isPasswordMatched) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (e) {
    console.log(e.message);
  }
});

//API CHANGE PASSWORD

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserDetailsQuery = `
select
*
from
user
where username = '${username}'
`;
  const dbUser = await db.get(getUserDetailsQuery);

  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);

  if (isPasswordMatched) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
        update user
        set password = '${hashedPassword}'
        where username = '${username}'
        `;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
