var spriteMaker;
var SpriteMaker = (function () {
    function SpriteMaker() {
        var _this = this;
        this.ProcessingImage = false;
        this.Images = [];
        this.totalImageSelected = 0;
        this.imageProcessedCount = 0;
        $("#txt-files").change(function () {
            var files = $("#txt-files")[0].files;
            _this.OnFilesChosen(files);
        });
    }
    SpriteMaker.prototype.ChooseFiles = function () {
        if (this.ProcessingImage) {
            return;
        }
        $("#txt-files").trigger("click");
    };
    SpriteMaker.prototype.OnFilesChosen = function (files) {
        if (this.ProcessingImage) {
            return;
        }
        // Convert to array
        var temp = [];
        for (var i = 0; i < files.length; i++) {
            temp.push(files[i]);
        }
        files = temp;
        this.ProcessingImage = true;
        // Read files
        this.imageProcessedCount = 0;
        this.totalImageSelected = files.length;
        if (this.totalImageSelected > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.type.indexOf("image/") != 0) {
                    files.splice(i, 1);
                    i--;
                    this.totalImageSelected--;
                    continue;
                }
                this.ProcessFile(file, this.Images.length + i);
            }
        }
        if (this.totalImageSelected == 0) {
            this.ProcessingImage = false;
        }
        // Remove files
        $("#txt-files").val("");
    };
    SpriteMaker.prototype.ShowList = function () {
        var list = $("#lst-files");
        list.html("");
        var template = $("#template-image").html();
        for (var i = 0; i < this.Images.length; i++) {
            var image = this.Images[i];
            var listItem = $(template);
            listItem.find(".file-image").attr("src", image);
            list.append(listItem);
        }
        if (this.Images.length == 0) {
            $(".placeholder").removeClass("hidden");
        }
        else {
            $(".placeholder").addClass("hidden");
        }
    };
    SpriteMaker.prototype.DeleteImage = function (image) {
        // Stop the upper panel to receive the signal
        event.stopPropagation();
        // Find the index
        var li = $(image).closest("li")[0];
        var items = $("#lst-files > li");
        var index = 0;
        for (; index < items.length; index++) {
            if (items[index] == li) {
                break;
            }
        }
        if (index == items.length) {
            // This should never happen
            return;
        }
        // Delete
        $(li).remove();
        this.Images.splice(index, 1);
        this.ShowEstimate();
    };
    SpriteMaker.prototype.ShowEstimate = function () {
        var _this = this;
        this.Estimate(function (data) {
            $("#lbl-sprite-size").html(_this.spriteWidth + " x " + _this.spriteHeight);
            $("#lbl-estimated-size").html(data.EstimatedImageWidth + " x " + data.EstimatedImageHeight);
        });
    };
    SpriteMaker.prototype.Estimate = function (callback) {
        var _this = this;
        var estimatedImageWidth = Number.NaN;
        var estimatedImageHeight = Number.NaN;
        if (this.Images.length == 0) {
            this.spriteWidth = Number.NaN;
            this.spriteHeight = Number.NaN;
            callback({
                EstimatedImageWidth: Number.NaN,
                EstimatedImageHeight: Number.NaN,
            });
        }
        else {
            var firstImage = new Image();
            firstImage.src = this.Images[0];
            firstImage.onload = function () {
                _this.spriteWidth = firstImage.width;
                _this.spriteHeight = firstImage.height;
                var col = Number($("#txt-col").val());
                var neededRow = Math.ceil(_this.Images.length / col);
                if (col > _this.Images.length) {
                    col = _this.Images.length;
                }
                var margin = Number($("#txt-margin").val());
                estimatedImageWidth = _this.spriteWidth * col + margin * (col + 1);
                estimatedImageHeight = _this.spriteHeight * neededRow + margin * (neededRow + 1);
                var requirePowerOf2 = $("#chk-power-2").prop("checked");
                if (requirePowerOf2) {
                    estimatedImageWidth = _this.FindNearestPow2(estimatedImageWidth);
                    estimatedImageHeight = _this.FindNearestPow2(estimatedImageHeight);
                }
                if (estimatedImageWidth <= 0 || estimatedImageHeight <= 0) {
                    estimatedImageWidth = Number.NaN;
                    estimatedImageHeight = Number.NaN;
                }
                callback({
                    EstimatedImageWidth: estimatedImageWidth,
                    EstimatedImageHeight: estimatedImageHeight,
                    Columns: col,
                    Margin: margin,
                });
            };
        }
    };
    SpriteMaker.prototype.Generate = function () {
        var _this = this;
        if (this.Images.length == 0) {
            alert("Please choose at least 1 image.");
            return;
        }
        this.Estimate(function (data) {
            var width = data.EstimatedImageWidth;
            var height = data.EstimatedImageHeight;
            var margin = data.Margin;
            var columns = data.Columns;
            if (isNaN(data.EstimatedImageWidth) || isNaN(data.EstimatedImageHeight)) {
                alert("Invalid numbers.");
                return;
            }
            var canvas = document.getElementById("canvas");
            canvas.width = width;
            canvas.height = height;
            var context = canvas.getContext("2d");
            var col = 0;
            var x = margin;
            var y = margin;
            for (var i = 0; i < _this.Images.length; i++) {
                (function () {
                    var image = new Image();
                    var drawX = x;
                    var drawY = y;
                    image.onload = function () {
                        context.drawImage(image, 0, 0, _this.spriteWidth, _this.spriteHeight, drawX, drawY, _this.spriteWidth, _this.spriteHeight);
                    };
                    image.src = _this.Images[i];
                })();
                col++;
                x += _this.spriteWidth + margin;
                if (col == columns) {
                    col = 0;
                    y += _this.spriteHeight + margin;
                    x = margin;
                }
            }
            $("#btn-download").removeClass("hidden");
            $("#lbl-download").removeClass("hidden");
        });
    };
    SpriteMaker.prototype.DownloadImage = function () {
        var canvas = $("#canvas")[0];
        var url = canvas.toDataURL();
        window.open(url);
    };
    SpriteMaker.prototype.FindNearestPow2 = function (number) {
        var result = 0;
        while (true) {
            var current = Math.pow(2, result);
            if (current >= number) {
                return current;
            }
            result++;
        }
    };
    SpriteMaker.prototype.ProcessFile = function (file, index) {
        var _this = this;
        var reader = new FileReader();
        reader.onload = function () {
            _this.Images[index] = reader.result;
            _this.imageProcessedCount++;
            if (_this.imageProcessedCount == _this.totalImageSelected) {
                _this.ProcessingImage = false;
                _this.ShowEstimate();
                _this.ShowList();
            }
        };
        reader.readAsDataURL(file);
    };
    return SpriteMaker;
}());
$(function () {
    spriteMaker = new SpriteMaker();
    $("#pnl-files").click(function () { spriteMaker.ChooseFiles(); });
    $("#lst-files").on("click", ".btn.btn-delete", function () { spriteMaker.DeleteImage(this); });
    $("#txt-col").on("change input", function () { spriteMaker.ShowEstimate(); });
    $("#txt-margin").on("change input", function () { spriteMaker.ShowEstimate(); });
    $("#chk-power-2").on("change", function () { spriteMaker.ShowEstimate(); });
    $("#pnl-files").on("drop", function () {
        event.preventDefault();
        event.stopPropagation();
        var data = event.dataTransfer;
        if (!data) {
            return;
        }
        if (data.items) {
            var files = [];
            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];
                if (item.kind == "file") {
                    files.push(item);
                }
            }
            spriteMaker.OnFilesChosen(data.files);
        }
        else {
            spriteMaker.OnFilesChosen(data.files);
        }
    });
    $("#pnl-files").on("dragover", function () {
        event.preventDefault();
        event.stopPropagation();
    });
    $("#pnl-files").on("dragend", function () {
        event.preventDefault();
        event.stopPropagation();
    });
    $("#btn-generate").click(function () {
        spriteMaker.Generate();
    });
    $("#btn-download").click(function () {
        spriteMaker.DownloadImage();
    });
});
//# sourceMappingURL=main.js.map