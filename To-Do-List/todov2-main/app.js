//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin:drizzle@cluster0.05fqvxv.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const CustomList = mongoose.model("CustomList", listSchema);

const defaultItems = [
  { name: "Test 1" },
  { name: "Test 2" },
  { name: "Test 3" },
];

app.get("/", function(req, res) {

// const day = date.getDate();

Item.find().exec().then((presentItems)=>{
  if(presentItems.length === 0){
    Item.insertMany(defaultItems);
    res.redirect("/");
  }
  else{
  res.render("list", {listTitle: "Today", newListItems: presentItems});
  }
})

});


app.get("/:route", (req,res)=>{

  let customTitle = _.capitalize(req.params.route);

  CustomList.findOne({name: customTitle}).exec().then((result)=>{
    if(!result){
      const list = new CustomList({
        name: customTitle,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customTitle);
    }
    else{
      res.render("list", {listTitle: result.name, newListItems: result.items});
    }
  });

});


app.post("/", function(req, res){
  const newItemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: newItemName
  });

  if(listName === "Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    CustomList.findOne({name:listName}).exec().then((foundList=>{
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    }))
  }
});


app.post("/delete", (req, res)=>{
  const checkedID = req.body.checked;
  const listTitle = req.body.listName;
  if(listTitle === "Today"){
    Item.findByIdAndDelete(checkedID).exec();
    res.redirect("/");
  }
  else{
    CustomList.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkedID}}}).exec();
    res.redirect("/" + listTitle);
  }
});


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
