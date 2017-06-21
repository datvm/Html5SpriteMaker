$(function () {
    var footer = $("footer");

    if (footer.position().top + footer.height() < $(window).height()) {
        footer.addClass("fixed");
    }
});