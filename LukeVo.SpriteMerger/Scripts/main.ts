var spriteMaker: SpriteMaker;

class SpriteMaker {

    private ProcessingImage: boolean = false;

    public Images: string[] = [];

    private spriteWidth: number;
    private spriteHeight: number;

    private totalImageSelected: number = 0;
    private imageProcessedCount: number = 0;

    constructor() {
        $("#txt-files").change(() => {
            var files = (<any>$("#txt-files")[0]).files;
            this.OnFilesChosen(files);
        });
    }

    public ChooseFiles() {
        if (this.ProcessingImage) {
            return;
        }

        $("#txt-files").trigger("click");
    }

    public OnFilesChosen(files: File[]) {
        if (this.ProcessingImage) {
            return;
        }

        // Convert to array
        var temp: File[] = [];
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
    }

    public ShowList(): void {
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
        } else {
            $(".placeholder").addClass("hidden");
        }
    }

    public DeleteImage(image: HTMLElement): void {
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
    }

    public ShowEstimate(): void {
        this.Estimate((data) => {
            $("#lbl-sprite-size").html(this.spriteWidth + " x " + this.spriteHeight);
            $("#lbl-estimated-size").html(data.EstimatedImageWidth + " x " + data.EstimatedImageHeight);
        });
    }

    private Estimate(callback: Function): void {
        var estimatedImageWidth = Number.NaN;
        var estimatedImageHeight = Number.NaN;

        if (this.Images.length == 0) {
            this.spriteWidth = Number.NaN;
            this.spriteHeight = Number.NaN;

            callback({
                EstimatedImageWidth: Number.NaN,
                EstimatedImageHeight: Number.NaN,
            });
        } else {
            var firstImage = new Image();
            firstImage.src = this.Images[0];

            firstImage.onload = () => {
                this.spriteWidth = firstImage.width;
                this.spriteHeight = firstImage.height;

                var col = Number($("#txt-col").val());
                var neededRow = Math.ceil(this.Images.length / col);

                if (col > this.Images.length) {
                    col = this.Images.length;
                }

                var margin = Number($("#txt-margin").val());

                estimatedImageWidth = this.spriteWidth * col + margin * (col + 1);
                estimatedImageHeight = this.spriteHeight * neededRow + margin * (neededRow + 1);

                var requirePowerOf2 = $("#chk-power-2").prop("checked");
                if (requirePowerOf2) {
                    estimatedImageWidth = this.FindNearestPow2(estimatedImageWidth);
                    estimatedImageHeight = this.FindNearestPow2(estimatedImageHeight);
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
            }
        }
    }

    public Generate() {
        if (this.Images.length == 0) {
            alert("Please choose at least 1 image.");
            return;
        }

        this.Estimate((data) => {
            var width = data.EstimatedImageWidth;
            var height = data.EstimatedImageHeight;
            var margin = data.Margin;
            var columns = data.Columns;

            if (isNaN(data.EstimatedImageWidth) || isNaN(data.EstimatedImageHeight)) {
                alert("Invalid numbers.");
                return;
            }

            var canvas = <HTMLCanvasElement>document.getElementById("canvas");
            canvas.width = width;
            canvas.height = height;

            var context = canvas.getContext("2d");

            var col = 0;
            var x = margin;
            var y = margin;


            for (var i = 0; i < this.Images.length; i++) {
                (() => {
                    var image = new Image();
                    var drawX = x;
                    var drawY = y;

                    image.onload = () => {
                        context.drawImage(image, 0, 0, this.spriteWidth, this.spriteHeight,
                            drawX, drawY, this.spriteWidth, this.spriteHeight);
                    };

                    image.src = this.Images[i];
                })();

                col++;
                x += this.spriteWidth + margin;
                if (col == columns) {
                    col = 0;
                    y += this.spriteHeight + margin;
                    x = margin;
                }
            }

            $("#btn-download").removeClass("hidden");
            $("#lbl-download").removeClass("hidden");
        });
    }

    public DownloadImage(): void {
        var canvas = (<HTMLCanvasElement>$("#canvas")[0]);
        var url = canvas.toDataURL();
        window.open(url);
    }

    public FindNearestPow2(number: number): number {
        var result = 0;

        while (true) {
            var current = Math.pow(2, result);

            if (current >= number) {
                return current;
            }

            result++;
        }
    }

    private ProcessFile(file: File, index: number) {
        var reader = new FileReader();

        reader.onload = () => {
            this.Images[index] = reader.result;
            this.imageProcessedCount++;

            if (this.imageProcessedCount == this.totalImageSelected) {
                this.ProcessingImage = false;
                this.ShowEstimate();
                this.ShowList();
            }
        };

        reader.readAsDataURL(file);
    }

}

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

        var data = (<any>event).dataTransfer;

        if (!data) { return; }

        if (data.items) {
            var files = [];

            for (var i = 0; i < data.items.length; i++) {
                var item = data.items[i];

                if (item.kind == "file") {
                    files.push(item);
                }
            }

            spriteMaker.OnFilesChosen(data.files);
        } else {
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
    })
});