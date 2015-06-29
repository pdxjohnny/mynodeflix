$(function(){
  dir_change();
  $("#directory").change(dir_change);
  $("#collection").keyup(collection_change);
});

function dir_change() {
  var dir_path = ["api", "movie", 0];
  dir_path[2] = $("#directory").val();
  dir_path = '/' + dir_path.join('/');
  $.get(dir_path, function (data) {
    $("#media").html("");
    for (var collection in data)
    {
      var current = $("#media").html();
      current += "<div id=\"" + data[collection] +
        "\" class=\"row\">" +
        "<h2>" + data[collection] + "</h2>" +
        "</div>";
      $("#media").html(current);
      populate_collection(data[collection]);
    }
  });
}

function populate_collection(collection) {
  var dir_path = ["api", "movie", 0, 0];
  dir_path[2] = $("#directory").val();
  // The collection name
  dir_path[3] = collection;
  dir_path = '/' + dir_path.join('/');
  $.get(dir_path, function (data) {
    for (var name in data)
    {
      var media_url = dir_path + '/' + data[name];
      var current = $("#media [id='" + collection + "']").html();
      current += "<div id=\"" + data[name] + "\"" +
        " class=\"div.col-md-2\" >" +
        " <video src=\"" + media_url + "\"" +
        " height=\"240\"" +
        " controls ></video><br>" +
        "<a href=\"" + media_url + "\" >" + data[name] + "</a>" +
        "</div>";
      $("#media [id='" + collection + "']").html(current);
    }
  });
}

function collection_change() {
}
