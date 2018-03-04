((exports) => {

	let $imgur_window;

	function show_imgur_uploader(blob) {
		if ($imgur_window) {
			$imgur_window.close();
		}
		$imgur_window = $DialogWindow().title(localize("Canvas Overview")).addClass("horizontal-buttons");

		const $preview_image_area = $(E("div")).appendTo($imgur_window.$main).addClass("inset-deep");
		const $imgur_url_area = $(E("div")).appendTo($imgur_window.$main);
		const $imgur_status = $(E("div")).appendTo($imgur_window.$main);

		// @TODO: maybe make this preview small but zoomable to full size?
		// (starting small (max-width: 100%) and toggling to either scrollable or fullscreen)
		// it should be clear that it's not going to upload a downsized version of your image
		const $preview_image = $(E("img")).appendTo($preview_image_area).css({
			display: "block", // prevent margin below due to inline display (vertical-align can also be used)
		});
		const blob_url = URL.createObjectURL(blob);
		$preview_image.attr({ src: blob_url });
		// $preview_image.css({maxWidth: "100%", maxHeight: "400px"});
		$preview_image_area.css({
			maxWidth: "90vw",
			maxHeight: "70vh",
			overflow: "auto",
			marginBottom: "0.5em",
		});
		$preview_image.on("load", () => {
			$imgur_window.css({ width: "auto" });
			$imgur_window.center();
		});
		$imgur_window.on("close", () => {
			URL.revokeObjectURL(blob_url);
		});

		const $cancel_button = $imgur_window.$Button(localize("Cancel"), () => {
			$imgur_window.close();
		}).focus();
		$imgur_window.$content.css({
			width: "min(1000px, 80vw)",
		});
		$imgur_window.center();
	}

	exports.show_imgur_uploader = show_imgur_uploader;

})(window);
