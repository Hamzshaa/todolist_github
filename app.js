//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//mongodb://127.0.0.1:27017
mongoose.connect(
  "mongodb+srv://trident:yMf25toKWG4Dqevi@postdb.ryg6kpw.mongodb.net/toDB"
);

const itemsSchema = {
  name: String,
};
const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find({}).then((result) => {
    if (result.length === 0) {
      Item.insertMany(defaultItems).then(() => {
        console.log("Successfully Inserted Initial Items!");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: result });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  if (listName === "Today") {
    if (itemName !== "") {
      item.save().then(() => {
        console.log("Saved To Main Collection Successfully!");
      });
    }

    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);

      if (itemName !== "") {
        foundList.save().then(() => {
          console.log("Saved To " + listName + " Collection Successfully!");
        });
      }
      res.redirect("/" + listName);
    });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});
app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId }).then(() => {
      console.log("Deleted Successfully!");
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    ).then(() => {
      console.log("Deleted Successfully from " + listName + " Collection!");
    });
    res.redirect("/" + listName);
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }).then((foundList) => {
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save().then(() => {
        console.log("Custom List Saved Successfully!");
      });
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server started on port 3000");
});
