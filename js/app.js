/*
Copyright 2012 Google Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
Author: Eric Bidelman (ericbidelman@chromium.org)
Updated: Joe Marini (joemarini@google.com)
*/


var chosenEntry = null;
var LogoCheck = document.querySelector('#ChkLogo');
var TypeCheck = document.querySelector('#ChkType');
var SizeCheck = document.querySelector('#ChkSize');
var LogoButton = document.querySelector('#choose_logo');
var Type = document.querySelector('#txtType');
var Size = document.querySelector('#txtSize');
var FontSelect = document.querySelector('#txtFont');
var chooseFileButton = document.querySelector('#choose_file');
var chooseDirButton = document.querySelector('#choose_dir');
var ClearPicturesButton = document.querySelector('#btnClearImages');
var ClearAllButton = document.querySelector('#btnClearAll');
var savePNGButton = document.querySelector('#save_PNG');
var saveJPGButton = document.querySelector('#save_JPG');
var RunButton = document.querySelector('#btnRun');
var entries = [];
var CropImages = [];
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
  console.log("128");
  ResizeBlob = ResizeLogo(file).then(function(res){
    console.log(ResizeBlob);
    //images.src = ResizeBlob;
    //loadImageFromURL(URL.createObjectURL(ResizeBlob));
  })
  //loadLogoFromURL(URL.createObjectURL(ResizeBlob));
}

function loadImageFromFile(file) {
  //ResizeBlob = ResizeImage(file);
  //console.log("138"+file);
  ResizeImage(file).then(function(res){
    console.log("142");
    //images.src = ResizeBlob;
    //loadImageFromURL(URL.createObjectURL(ResizeBlob));
  })
  //console.log(ResizeBlob);
  //images.src = ResizeBlob;
  // loadImageFromURL(URL.createObjectURL(ResizeBlob));
}

function loadLogoFromURL(url) {
  clearState();
  img.onload = LogoHasLoaded;
  img.onerror = LogoHasLoaded;
  img.src = url;
}

function loadImageFromURL(url) {
  //console.log("141 - "+url);
  //ResizeBlob = ResizeImage(url);
  //.getElementById('select').onchange = function(evt) {

  //};
  // console.log(ResizeBlob);
  console.log("163");
  images.src = url;
  entries.push(images.src);
  body.removeClass("loading");
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
  //var originalImage = document.getElementById("image-original"),
  		//resetImage = document.getElementById("image-reset");


  console.log("ResizeImage");
  ImageTools.resize(url, {
      width: 200, // maximum width
      height: 200 // maximum height
  }, function(blob, didItResize) {
      // didItResize will be true if it managed to resize it, otherwise false (and will return the original file as 'blob')
      //document.getElementById('preview').src = window.URL.createObjectURL(blob);
      // you can also now upload this blob using an XHR.
      console.log(didItResize);

      //images.src = blob;
      //return blob;
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

        // GetOrientation(url, function(Orientation){
        //   console.log("272 "+Orientation);
           resetOrientation(blobBase64, ImgOrientation, function(resetBase64Image) {
            console.log("274");
            loadImageFromURL(resetBase64Image);
            // images.src = resetBase64Image;
            // entries.push(images.src);
            // body.removeClass("loading");
          });
        // });

        // resetOrientation(blobBase64, 5, function(resetBase64Image) {
        //   console.log("274");
        //   loadImageFromURL(resetBase64Image);
        // });
    });

        cropsrc = window.URL.createObjectURL(url);
        $('#crop').prepend('<img id="crop" src="'+cropsrc+'" />');
        var images = document.querySelectorAll('img');
        var length = images.length;
        var croppers = [];
        var i;
        for (i = 0; i < length; i++) {
          croppers.push(new Cropper(images[i],{
            autoCropArea:0.2,
            ready: function () {
              this.cropper.zoom(0.1);
              this.cropper.setCropBoxData({"left":650,"width":100,"height":100})
              base64 = this.cropper.getCroppedCanvas({width:125,height:125}).toDataURL();
              $('#croped').prepend('<img id="croped" src="'+base64+'"/>');
              CropImages.push(base64);
              // $('#crop').hide()
              // $('#croped').hide()
            }
          }));
        }
  });

}

function HideDiv(){
  //$('#crop').hide()
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
  console.log("149 - "+fileEntry);
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
  console.log("177 - "+img.width);
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  console.log("180 - "+canvas.width);
  console.log("222 - "+img.src);
  var cc = canvasContext;

  if (!img.width || !img.height || !canvas.width || !canvas.height)
    return;  // No img, so just leave canvas cleared.

  cc.drawImage(img, 0, 0, 100, 100 * img.height / img.width)
}



// for directories, read the contents of the top-level directory (ignore sub-dirs)
// and put the results into the textarea, then disable the Save As button
function loadDirEntry(_chosenEntry, callback) {
  chosenEntry = _chosenEntry;
  console.log(chosenEntry);
  if (chosenEntry.isDirectory) {
    var dirReader = chosenEntry.createReader();
    var entries = [];

    // Call the reader.readEntries() until no more results are returned.
    var readEntries = function() {
       dirReader.readEntries (function(results) {
        if (!results.length) {
          console.log("end");
           displayEntryData(chosenEntry);
        }
        else {
          results.forEach(function(item) {
            item.file(function(file) {
              loadImageFromFile(file);
            });
          });
          readEntries();

        }
      }, errorHandler);
    };

    readEntries(); // Start reading dirs.

  }

  //displayEntryData(chosenEntry);


}

function loadInitialFile(launchData) {
  if (launchData && launchData.items && launchData.items[0]) {
    loadFileEntry(launchData.items[0].entry);
  }
  else {
    // see if the app retained access to an earlier file or directory
    chrome.storage.local.get('chosenFile', function(items) {
      if (items.chosenFile) {
        // if an entry was retained earlier, see if it can be restored
        chrome.fileSystem.isRestorable(items.chosenFile, function(bIsRestorable) {
          // the entry is still there, load the content
          console.info("Restoring " + items.chosenFile);
          chrome.fileSystem.restoreEntry(items.chosenFile, function(chosenEntry) {
            if (chosenEntry) {
              chosenEntry.isFile ? loadFileEntry(chosenEntry) : loadDirEntry(chosenEntry);
            }
          });
        });
      }
    });
  }
}
function MakeZoomedImage(){
  console.log(WatermarkText);
  $.each(entries, function( index, value ) {
    // $('#crop').prepend('<img id="crop'+index+'" src="'+value+'" />');
    // var basic = $('#crop'+index).croppie({viewport: { width: 125, height: 125}, boundary: { width: 520, height: 760 },enableZoom:0});
    // $('#crop'+index).imagesLoaded( function() {
    // // body.addClass("loading");
    // basic.croppie('bind', {url: value, points:[20,20,20,20]}).then(function() {
    //   basic.croppie('result', 'base64', {size: [200,200]}).then(function(base64) {
    //     $('#crop'+index).imagesLoaded( function() {
    //     $('#croped').prepend('<img id="croped'+index+'" src="'+base64+'" />')
    //       $('#croped').hide()
    //       $('#crop').hide()
    //       body.removeClass("loading");
    //       });

          //begin watermarking
          var t = $("<div id='container"+index+"' class='WatermarkPhotoContainer'></div>");
          $('#watermarked').append(t);
          watermark([value, img])
          .image(watermark.image.upperRight())
          .render()
          .image(watermark.text.upperLeft(WatermarkText, FontSize+'px '+Font, TextColor, 0.0, 48))
          .load([CropImages[index]])
          .image(watermark.image.lowerLeft())
          .then(image => document.getElementById('container'+index).appendChild(image).setAttribute("class", "WatermarkPhoto"));
      //   });
      // });
      // });
    });



  // $.each(entries, function( index, value ) {
  //   $('#crop').prepend('<img id="crop'+index+'" src="'+value+'" />');
  //   var basic = $('#crop'+index).croppie({viewport: { width: 125, height: 125}, boundary: { width: 520, height: 760 },enableZoom:0});
  //   $('#crop'+index).imagesLoaded( function() {
  //   // body.addClass("loading");
  //   basic.croppie('bind', {url: value, points:[20,20,20,20]}).then(function() {
  //     basic.croppie('result', 'base64', {size: [200,200]}).then(function(base64) {
  //       $('#crop'+index).imagesLoaded( function() {
  //       $('#croped').prepend('<img id="croped'+index+'" src="'+base64+'" />')
  //         $('#croped').hide()
  //         $('#crop').hide()
  //         body.removeClass("loading");
  //         });
  //
  //         //begin watermarking
  //         var t = $("<div id='container"+index+"' class='WatermarkPhotoContainer'></div>");
  //         $('#watermarked').append(t);
  //         watermark([value, img])
  //         .image(watermark.image.upperRight())
  //         .render()
  //         .image(watermark.text.upperLeft(WatermarkText, FontSize+'px '+Font, TextColor, 0.0, 48))
  //         .load([base64])
  //         .image(watermark.image.lowerLeft())
  //         .then(image => document.getElementById('container'+index).appendChild(image).setAttribute("class", "WatermarkPhoto"));
  //       });
  //     });
  //     });
  //   });

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
      //color.toHexString(); // #ff0000
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


});




//LogoCheck.addEventListener('click', function(e) {
  //console.log("logo "+LogoCheck.value);
  //$('#LogoCanvas').fadeIn('fast');
  // if (this.checked){
  //   $(LogoButton).prop( "disabled", false );
  //   //$(LogoButton).fadeIn('fast');
  // } else {
  //   //$(LogoButton).fadeOut('fast');
  //   $(LogoButton).prop( "disabled", true );
  //
  // }
//});

// TypeCheck.addEventListener('click', function(e) {
//   console.log("type click");
//   if (this.checked){
//     $(Type).prop( "disabled", false );
//     //$(Type).fadeIn('fast');
//  } else {
//    $(Type).prop( "disabled", true );
//    //$(Type).fadeOut('fast');
//   }
// });
//
// SizeCheck.addEventListener('click', function(e) {
//   if (this.checked){
//     $(Size).prop( "disabled", false );
//     //$(Size).fadeIn('fast');
//   } else{
//     $(Size).prop( "disabled", true );
//     //$(Size).fadeOut('fast');
//   }
// });

LogoButton.addEventListener('click', function(e) {
  $('#LogoCanvas').fadeIn('fast');
  var accepts = [{
    mimeTypes: ['image/*'],
    extensions: ['jpeg','png']
  }];
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
    if (!theEntry) {
      console.log(theEntry);
      output.textContent = 'No image selected.';
      return;
    }
    // use local storage to retain access to this file
    console.log(theEntry);
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
    loadDirEntry(theEntry, function(){
      HideDiv();
    });
  });

});

savePNGButton.addEventListener('click', function(e) {
  var zip = new JSZip();
  var img = zip.folder("images");
  $(".WatermarkPhoto").each(function(index) {
   imgsrc = this.src;
   var DataURL = imgsrc.replace('data:image/png;base64,','');
   img.file(index+".png", DataURL, {base64: true});
  });
  zip.generateAsync({type:"blob"})
  .then(function(content) {
      saveAs(content, WatermarkText+".zip");
  });
});

saveJPGButton.addEventListener('click', function(e) {
  var zip = new JSZip();
  var img = zip.folder("images");
  $(".WatermarkPhoto").each(function(index) {
      $('#JPGContainer').prepend('<canvas id="JPG'+index+'" />');
      imgsrc = this.src;
      //console.log(imgsrc);
      var imageJPG = convertImageToCanvas(index,imgsrc);
      //console.log(imageJPG);
      $('#JPGContainer').imagesLoaded( function() {
        var imageJPGURL = imageJPG.toDataURL("image/jpeg");
        var DataURL = imageJPGURL.replace('data:image/jpeg;base64,','');
        img.file(index+".jpg", DataURL, {base64: true});
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
  console.log(entries);
  //body.addClass("loading");
  $('#watermarked').fadeIn('fast');
  if (Type.value !== "" && Size.value !== ""){
    console.log("type and size");
    WatermarkText = Type.value+" - "+Size.value;
    console.log(WatermarkText);
  } else if (Type.value == "" && Size.value !== ""){
    console.log("size");
    WatermarkText = Size.value;
    console.log(WatermarkText);
  } else if (Type.value !== "" && Size.value == ""){
    console.log("type");
    WatermarkText = Type.value;
    console.log(WatermarkText);
  }
  Font = FontSelect.value;
  FontSize = $("#SlideFontSize").slider("getValue");
  MakeZoomedImage();
  savePNGButton.disabled = false;
  saveJPGButton.disabled = false;
});

ClearPicturesButton.addEventListener('click', function(e) {
  //chrome.storage.local.remove(chosenFile);
  chrome.storage.local.remove(["chosenFile"],function(){
  var error = chrome.runtime.lastError;
      if (error) {
          console.error(error);
      }
  })
  //basic.destroy()
  entries = [];
  CropImages = [];
  document.getElementById('file_path').value = "";
  $('#watermarked').empty();
  $('#watermarked').hide();
  $('#crop').empty();
  $('#croped').empty();
  $('#croped').show()
  $('#crop').show()
  $('#JPGContainer').empty();
  savePNGButton.disabled = true;
  saveJPGButton.disabled = true;
});

ClearAllButton.addEventListener('click', function(e) {
  //chrome.storage.local.remove(chosenFile);
  chrome.storage.local.remove(["chosenFile"],function(){
  var error = chrome.runtime.lastError;
      if (error) {
          console.error(error);
      }
  })
  //basic.destroy()
  entries = [];
  CropImages = [];
  document.getElementById('file_path').value = "";
  //$('#txtType').selected([0]);
  //$("#txtType")[0].selectedIndex = 0;
  $('#txtType').selectpicker('val', 0);
  //$('#txtSize').selected([0]);
  //$("#txtSize")[0].selectedIndex = 0;
  $('#txtSize').selectpicker('val', 0);

  //$('#txtFont').selected([0]);
  //$("#txtFont")[0].selectedIndex = 0;
  $('#txtFont').selectpicker('val', 0);

  $('#LogoCanvas').empty();
  $('#watermarked').empty();
  $('#watermarked').hide();
  $('#crop').empty();
  $('#croped').empty();
  $('#croped').show()
  $('#crop').show()
  $('#JPGContainer').empty();
  savePNGButton.disabled = true;
  saveJPGButton.disabled = true;
});
