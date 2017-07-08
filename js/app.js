
var chosenEntry = null;
var LogoCheck = document.querySelector('#ChkLogo');
var TypeCheck = document.querySelector('#ChkType');
var SizeCheck = document.querySelector('#ChkSize');
var LogoButton = document.querySelector('#choose_logo');
var Type = "";
var Size = "";
var FontSelect = "sans-serif";
var chooseFileButton = document.querySelector('#choose_file');
var chooseDirButton = document.querySelector('#choose_dir');
var PhotoAmount = "";
var ClearPicturesButton = document.querySelector('#btnClearImages');
var ClearAllButton = document.querySelector('#btnClearAll');
var savePNGButton = document.querySelector('#save_PNG');
var saveJPGButton = document.querySelector('#save_JPG');
var RunButton = document.querySelector('#btnRun');
var entries = [];
var CropImages = [];
var croppers = [];
var images = new Image();
var canvas = document.querySelector('canvas');
var canvasContext = canvas.getContext('2d');
var image_display = document.querySelector('#image_display');
var img = new Image();
var croped = [];
var WatermarkText = "";
var Font = "";
var FontSize = "";
var TextColor = "#fff";
var body = $("body");
var Orientation = "";

function errorHandler(e) {
  console.error(e);
}

function displayEntryData(theEntry) {
  if (theEntry.isFile) {
    chrome.fileSystem.getDisplayPath(theEntry, function(path) {
      document.querySelector('#file_path').value = path;
    });
    theEntry.getMetadata(function(data) {
      document.querySelector('#file_size').textContent = data.size;
    });
  }
  else {
    document.querySelector('#file_path').value = theEntry.fullPath;
    document.querySelector('#file_size').textContent = "N/A";
  }
}

function writeFileEntry(writableEntry, opt_blob, callback) {
  if (!writableEntry) {
    output.textContent = 'Nothing selected.';
    return;
  }

  writableEntry.createWriter(function(writer) {

    writer.onerror = errorHandler;
    writer.onwriteend = callback;

    // If we have data, write it to the file. Otherwise, just use the file we
    // loaded.
    if (opt_blob) {
      writer.truncate(opt_blob.size);
      waitForIO(writer, function() {
        writer.seek(0);
        writer.write(opt_blob);
      });
    }
    else {
      chosenEntry.file(function(file) {
        writer.truncate(file.fileSize);
        waitForIO(writer, function() {
          writer.seek(0);
          writer.write(file);
        });
      });
    }
  }, errorHandler);
}

function waitForIO(writer, callback) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();
  // wait for a few seconds
  var reentrant = function() {
    if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
      setTimeout(reentrant, 100);
      return;
    }
    if (writer.readyState===writer.WRITING) {
      console.error("Write operation taking too long, aborting!"+
        " (current writer readyState is "+writer.readyState+")");
      writer.abort();
    }
    else {
      callback();
    }
  };
  setTimeout(reentrant, 100);
}

// for files, read the text content into the textarea
function loadLogoEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  chosenEntry.file(function(file) {
    loadLogoFromFile(file);
    displayfileEntryPath(chosenFileEntry);
  });
}

function loadLogoFromFile(file) {
  ResizeBlob = ResizeLogo(file).then(function(res){
    console.log(ResizeBlob);
  })
}

function loadImageFromFile(file) {
  ResizeImage(file).then(function(res){
  })
}

function loadLogoFromURL(url) {
  clearState();
  img.onload = LogoHasLoaded;
  img.onerror = LogoHasLoaded;
  img.src = url;
}

function loadImageFromURL(url) {
  images.src = url;
  entries.push(images.src);
}

function resetOrientation(srcBase64, srcOrientation, callback) {
  var img = new Image();

  img.onload = function() {
    var width = img.width,
        height = img.height,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext("2d");

    // set proper canvas dimensions before transform & export
    if ([5,6,7,8].indexOf(srcOrientation) > -1) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    // transform context before drawing image
    switch (srcOrientation) {
      case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, width, height ); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, height ); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, height , 0); break;
      case 7: ctx.transform(0, -1, -1, 0, height , width); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
      default: ctx.transform(1, 0, 0, 1, 0, 0);
    }

    // draw image
    ctx.drawImage(img, 0, 0);

    // export base64
    console.log("203");
    callback(canvas.toDataURL());
  };

  img.src = srcBase64;
}

function ResizeLogo(url){
  console.log("ResizeImage");
  ImageTools.resize(url, {
      width: 200, // maximum width
      height: 200 // maximum height
  }, function(blob, didItResize) {
      // didItResize will be true if it managed to resize it, otherwise false (and will return the original file as 'blob')
      //document.getElementById('preview').src = window.URL.createObjectURL(blob);
      // you can also now upload this blob using an XHR.
      console.log(didItResize);
      loadLogoFromURL(URL.createObjectURL(blob));
  });
}

function GetOrientation(url,callback){
  console.log("228");


  var reader = new FileReader();
  reader.onload = function(e) {

    var view = new DataView(e.target.result);
    if (view.getUint16(0, false) != 0xFFD8) return callback(-2);
    var length = view.byteLength, offset = 2;
    while (offset < length) {
      var marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) return callback(-1);
        var little = view.getUint16(offset += 6, false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        var tags = view.getUint16(offset, little);
        offset += 2;
        for (var i = 0; i < tags; i++)
          if (view.getUint16(offset + (i * 12), little) == 0x0112)
            return callback(view.getUint16(offset + (i * 12) + 8, little));
      }
      else if ((marker & 0xFF00) != 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(url);
}
var c = 0;
function ResizeImage(url){
  console.log("ResizeImage");
  GetOrientation(url, function(Orientation){
    ImgOrientation = Orientation;
    console.log("272 "+ImgOrientation);
    ImageTools.resize(url, {
        width: 720, // maximum width
        height: 960 // maximum height
    }, function(blob, didItResize) {
        // didItResize will be true if it managed to resize it, otherwise false (and will return the original file as 'blob')
        blobBase64 = window.URL.createObjectURL(blob);
        // you can also now upload this blob using an XHR.
           resetOrientation(blobBase64, ImgOrientation, function(resetBase64Image) {
            console.log("274");
            loadImageFromURL(resetBase64Image);


            cropsrc = window.URL.createObjectURL(url);
            $('#cropdiv').prepend('<img id="crop" src="'+cropsrc+'" />');
            var images = document.querySelectorAll('#crop');
            var length = images.length;

            for (i = 0; i < length; i++) {
              croppers.push(new Cropper(images[i],{
                autoCropArea:0.2,
                ready: function () {
                  this.cropper.zoom(0.3);
                  console.log(this);
                  this.cropper.setCropBoxData({"width":125,"height":125})
                  c++;
                  console.log(PhotoAmount);
                  console.log(c);
                  //if (c == PhotoAmount){
                  base64 = this.cropper.getCroppedCanvas({width:150,height:150}).toDataURL();
                  $('#cropeddiv').prepend('<img id="croped" src="'+base64+'"/>');
                  $('#imgresized').prepend('<img id="finalimg" src="'+resetBase64Image+'" />');
                  // CropImages.push(base64);
                  if (PhotoAmount == c){
                    HideDiv();
                    body.removeClass("loading");

                  }

                }
              }));

            }

          });

    });
  });


}

function HideDiv(){
  $('#cropdiv').hide()
}

function LogoHasLoaded() {
  if (img.width && img.height) {
  } else {
    displayText("Image failed to load.");
  }
  drawCanvas();
}

function imageHasLoaded() {
  if (images.width && images.height) {
  } else {
    displayText("Image failed to load.");
  }
  drawCanvasWatermark();
}

function displayfileEntryPath(fileEntry) {
  chrome.fileSystem.getDisplayPath(fileEntry, displayText);
}

function displayText(text) {
    output.textContent = text;
}

function clearState() {
  img.src = "";
  drawCanvas(); // clear it.
}


function drawCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  var cc = canvasContext;

  if (!img.width || !img.height || !canvas.width || !canvas.height)
    return;  // No img, so just leave canvas cleared.

  cc.drawImage(img, 0, 0, 100, 100 * img.height / img.width)
}



// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button
function loadDirEntry(_chosenEntry, callback) {
  chosenEntry = _chosenEntry;
  if (chosenEntry.isDirectory) {
    var dirReader = chosenEntry.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
       dirReader.readEntries (function(results) {

        if (!results.length) {
           displayEntryData(chosenEntry);

        }
        else {
          PhotoAmount = results.length;
          results.forEach(function(item) {
            if (item.isDirectory){
              console.log("Directory found - Skipping over it - "+item);
              // var notification = new Notification('Directory found', {
              //   body: "Please only include photos in your directory",
              //   icon: "../images/AppIcon.png"
              // });
              PhotoAmount--;
              return;
            }
            item.file(function(file) {
              console.log(file);
              if (file.type == "image/jpeg" || file.type == "image/png"){
                loadImageFromFile(file);
              } else {
                PhotoAmount--;
                console.log(PhotoAmount);
                 if (PhotoAmount == 0){
                   var notification = new Notification('No photos found!', {
                     body: "Please include photos in the selected folder to process",
                     icon: "../images/AppIcon.png"
                   });
                   body.removeClass("loading");
                 }
                return;
              }
            });
          });

          readEntries();
        }
      }, errorHandler);
    };
    readEntries(); // Start reading dirs.
  }
}

// function loadInitialFile(launchData) {
//   if (launchData && launchData.items && launchData.items[0]) {
//     loadFileEntry(launchData.items[0].entry);
//   }
//   else {
//     // see if the app retained access to an earlier file or directory
//     chrome.storage.local.get('chosenFile', function(items) {
//       if (items.chosenFile) {
//         // if an entry was retained earlier, see if it can be restored
//         chrome.fileSystem.isRestorable(items.chosenFile, function(bIsRestorable) {
//           // the entry is still there, load the content
//           console.info("Restoring " + items.chosenFile);
//           chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
//             if (chosenEntry) {
//               chosenEntry.isFile ? loadFileEntry(chosenEntry) : loadDirEntry(chosenEntry);
//             }
//           });
//         });
//       }
//     });
//   }
// }

function CropAction(){
  var cropel = document.querySelectorAll('#crop');
  var length = cropel.length;

  var i;
  for (i = 0; i < length; i++) {
    base64 = cropel[i].cropper.getCroppedCanvas({width:125,height:125}).toDataURL();
    $('#croped').prepend('<img id="croped" src="'+base64+'"/>');
    CropImages.push(base64);
  }
}

function MakeZoomedImage(callback){
  $.each(entries, function( index, value ) {
    var cropel = document.querySelectorAll('#finalimg');
    var cropedel = document.querySelectorAll('#croped');

          //begin watermarking
          var t = $("<div id='container"+index+"' class='WatermarkPhotoContainer'></div>");
          $('#watermarked').append(t);
          watermark([cropel[index].src, img])
          .image(watermark.image.upperRight())
          .render()
          .image(watermark.text.upperLeft(WatermarkText, FontSize+'px '+FontSelect, TextColor, 0.0, 48))
          .load([cropedel[index].src])
          .image(watermark.image.lowerLeft())
          .then(image => document.getElementById('container'+index).appendChild(image).setAttribute("class", "WatermarkPhoto materialboxed responsive-img"));
    });

    return callback(1);

}

function convertImageToCanvas(index,imagePNG) {
  var canvas = document.getElementById('JPG'+index);
  var context = canvas.getContext('2d');
  var img = new Image();
  img.onload = function() {
    context.drawImage(this, 0, 0, canvas.width, canvas.height);
  }

  img.src = imagePNG;
  canvas.width = img.width;
  canvas.height = img.height;
	return canvas;
}



$( document ).ready(function() {
  $("#showPalette").spectrum({
    showPalette: true,
    palette: [
        ['#FED141', '#FF9D6E', '#F67599'],
        ['#DD7FD3', '#9595D2', '#8BB8E8'],
        ['#64CCC9', '#888B8D']
    ],
    change: function(color) {
      TextColor = color.toHexString();
      console.log(TextColor);
    }
  });

  //$('#font').fontselect();
  $("#SlideFontSize").slider({
    min: 10,
    max: 120,
    step: 1,
    value: 48,
    orientation: 'horizontal'
  });




  $(".style a").click( function() {
    Type = $(this).text();
    $('#StyleChose').html(Type);
    console.log(Type);
  });

  $(".size a").click( function() {
    Size = $(this).text();
    $('#SizeChose').html(Size);
    console.log(Size);
  });

  $(".font a").click( function() {
    FontSelect = $(this).text();
    $("<style> .fontface{font-family:'"+FontSelect+"';} </style>").appendTo(document.head);
    $('#FontChose').html(FontSelect);
    //console.log(FontSelect);
  });

});






LogoButton.addEventListener('click', function(e) {
  $('#LogoCanvas').fadeIn('fast');
  var accepts = [{
    mimeTypes: ['image/*'],
    extensions: ['jpeg','png']
  }];
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
    if (!theEntry) {
      output.textContent = 'No image selected.';
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
    loadLogoEntry(theEntry);
  });


});

chooseDirButton.addEventListener('click', function(e) {
  chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(theEntry) {
    body.addClass("loading");
    if (!theEntry) {
      //output.textContent = 'No Directory selected.';
      body.removeClass("loading");
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
    loadDirEntry(theEntry);
  });

});

savePNGButton.addEventListener('click', function(e) {
  var zip = new JSZip();
  if (WatermarkText == ""){
    var img = zip.folder("images");
  } else {
    var img = zip.folder(WatermarkText);
  }
  $(".WatermarkPhoto").each(function(index) {
   imgsrc = this.src;
   var DataURL = imgsrc.replace('data:image/png;base64,','');
   img.file(WatermarkText+index+".png", DataURL, {base64: true});
  });
  zip.generateAsync({type:"blob"})
  .then(function(content) {
      saveAs(content, WatermarkText+".zip");
  });
});

saveJPGButton.addEventListener('click', function(e) {
  var zip = new JSZip();
  if (WatermarkText == ""){
    var img = zip.folder("images");
  } else {
    var img = zip.folder(WatermarkText);
  }
  $(".WatermarkPhoto").each(function(index) {
      $('#JPGContainer').prepend('<canvas id="JPG'+index+'" />');
      imgsrc = this.src;
      //console.log(imgsrc);
      var imageJPG = convertImageToCanvas(index,imgsrc);
      //console.log(imageJPG);
      $('#JPGContainer').imagesLoaded( function() {
        var imageJPGURL = imageJPG.toDataURL("image/jpeg");
        var DataURL = imageJPGURL.replace('data:image/jpeg;base64,','');
        img.file(WatermarkText+index+".jpg", DataURL, {base64: true});
      });
  });
  $('#JPGContainer').imagesLoaded( function() {
    zip.generateAsync({type:"blob"})
    .then(function(content) {
        saveAs(content, WatermarkText+".zip");
    });
  });
});

RunButton.addEventListener('click', function(e) {
  if (document.getElementById('file_path').value == ""){
    //some alert
  }
  $('.WatermarkCog').css("display","block");
  if( document.getElementById('watermarked').innerHTML !== "" ) {
    $('#watermarked').empty();
  }
  $('#watermarked').fadeIn('fast');
  if (Type !== "" && Size !== ""){
    console.log("type and size");
    WatermarkText = Type+" - "+Size;
    console.log(WatermarkText);
  } else if (Type == "" && Size !== ""){
    console.log("size");
    WatermarkText = Size;
    console.log(WatermarkText);
  } else if (Type !== "" && Size == ""){
    console.log("type");
    WatermarkText = Type;
    console.log(WatermarkText);
  }
  //Font = FontSelect;
  FontSize = $("#SlideFontSize").slider("getValue");

  //CropAction();

  MakeZoomedImage(function(back){
    //$('.WatermarkCog').css("display","none");
  });
  savePNGButton.disabled = false;
  saveJPGButton.disabled = false;
  chooseDirButton.disabled = true;
  $('#watermarked').imagesLoaded( function() {
    $('.WatermarkCog').css("display","none");
  });
});

ClearPicturesButton.addEventListener('click', function(e) {
  chrome.storage.local.remove(["chosenFile"],function(){
  var error = chrome.runtime.lastError;
      if (error) {
          console.error(error);
      }
  })
  entries = [];
  CropImages = [];
  Croppers = [];
  PhotoAmount = 0;
  c = 0;

  document.getElementById('file_path').value = "";
  $('#watermarked').empty();
  $('#watermarked').hide();
  $('#cropdiv').empty();
  $('#cropeddiv').empty();
  $('#imgresized').empty();
  $('#cropdiv').show()
  $('#JPGContainer').empty();
  savePNGButton.disabled = true;
  saveJPGButton.disabled = true;
  $('#btnRun').disabled = false;
  chooseDirButton.disabled = false;
});

ClearAllButton.addEventListener('click', function(e) {
  chrome.storage.local.remove(["chosenFile"],function(){
  var error = chrome.runtime.lastError;
      if (error) {
          console.error(error);
      }
  })
  entries = [];
  CropImages = [];
  Croppers = [];
  document.getElementById('file_path').value = "";

  Type = "";
  $('#StyleChose').html("");

  Size = "";
  $('#SizeChose').html("");

  FontSelect = "";
  $('#FontChose').html("");

  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  $('#watermarked').empty();
  $('#watermarked').hide();
  $('#cropdiv').empty();
  $('#cropeddiv').empty();
  $('#imgresized').empty();
  $('#cropdiv').show()
  $('#JPGContainer').empty();
  savePNGButton.disabled = true;
  saveJPGButton.disabled = true;
  $('#btnRun').disabled = false;
  chooseDirButton.disabled = false;
});

//loadInitialFile(launchData);
