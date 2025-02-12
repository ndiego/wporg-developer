/* global jQuery, Prism, wporgFunctionReferenceI18n */
/**
 * function-reference.js
 *
 * Handles all interactivity on the single function page
 */

// eslint-disable-next-line id-length -- $ OK.
jQuery( function ( $ ) {
	// 22.5px (line height) * 15 for 15 lines + 15px top padding + 10px extra.
	// The extra 10px added to partially show next line so it's clear there is more.
	const MIN_HEIGHT = 22.5 * 15 + 15 + 10;

	function collapseCodeBlock( $element, $button ) {
		$button.text( wporgFunctionReferenceI18n.expand );
		$button.attr( 'aria-expanded', 'false' );
		// This uses `css()` instead of `height()` to prevent jQuery from adding
		// in the padding. We want to add in just the top padding, since the
		// bottom is intentionally cut off.
		$element.css( { height: MIN_HEIGHT + 'px' } );
	}

	function expandCodeBlock( $element, $button ) {
		$button.text( wporgFunctionReferenceI18n.collapse );
		$button.attr( 'aria-expanded', 'true' );
		// { height: auto; } can't be used here or the transition effect won't work.
		$element.height( $element.data( 'height' ) );
	}

	// For each code block, add the copy button & expanding functionality.
	$( '.wp-block-code' ).each( function ( i, element ) {
		const $element = $( element );
		let timeoutId;

		$element.wrap( '<div class="wporg-developer-code-block"></div>' );

		const $copyButtonContainer = $( '<div class="wp-block-button is-style-outline is-small"></div>' );
		const $copyButton = $( '<a href="#" class="wp-block-button__link wp-element-button has-background"></a>' );
		$copyButtonContainer.append( $copyButton );

		$copyButton.text( wporgFunctionReferenceI18n.copy );
		$copyButton.on( 'click', function ( event ) {
			event.preventDefault();
			clearTimeout( timeoutId );
			const code = $element.find( 'code' ).text();
			if ( ! code ) {
				return;
			}

			// This returns a promise which will resolve if the copy suceeded,
			// and we can set the button text to tell the user it worked.
			// We don't do anything if it fails.
			window.navigator.clipboard.writeText( code ).then( function () {
				$copyButton.text( wporgFunctionReferenceI18n.copied );
				wp.a11y.speak( wporgFunctionReferenceI18n.copied );

				// After 5 seconds, reset the button text.
				timeoutId = setTimeout( function () {
					$copyButton.text( wporgFunctionReferenceI18n.copy );
				}, 5000 );
			} );
		} );

		const $container = $( document.createElement( 'div' ) );
		$container.addClass( 'wp-code-block-button-container' );

		$container.append( '<code>' + wporgFunctionReferenceI18n.sourceFile + '</code>' );

		const $btnContainer = $( document.createElement( 'span' ) );

		// Check code block height, and if it's larger, add in the collapse
		// button, and set it to be collapsed differently.
		const originalHeight = $element.height();
		if ( originalHeight > MIN_HEIGHT ) {
			$element.data( 'height', originalHeight );

			const $expandButtonContainer = $( '<div class="wp-block-button is-style-outline is-small"></div>' );
			const $expandButton = $(
				'<a href="#" class="wp-block-button__link wp-element-button has-background" aria-controls="wporg-source-code"></a>'
			);
			$expandButton.on( 'click', function ( event ) {
				event.preventDefault();
				if ( 'true' === $expandButton.attr( 'aria-expanded' ) ) {
					collapseCodeBlock( $element, $expandButton );
				} else {
					expandCodeBlock( $element, $expandButton );
				}
			} );

			collapseCodeBlock( $element, $expandButton );
			$expandButtonContainer.append( $expandButton );
			$btnContainer.append( $expandButtonContainer );
		}

		$btnContainer.append( $copyButtonContainer );
		$container.append( $btnContainer );

		$element.before( $container );
	} );

	let $usesList, $usedByList, $showMoreUses, $hideMoreUses, $showMoreUsedBy, $hideMoreUsedBy;

	function toggleUsageListInit() {
		const usesToShow = $( '#uses-table' ).data( 'show' ),
			usedByToShow = $( '#used-by-table' ).data( 'show' );

		// We only expect one used_by and uses per document
		$usedByList = $( 'tbody tr', '#used-by-table' );
		$usesList = $( 'tbody tr', '#uses-table' );

		if ( $usedByList.length > usedByToShow ) {
			$usedByList = $usedByList.slice( usedByToShow ).hide();

			$showMoreUsedBy = $( '.used-by .show-more' ).show().on( 'click', toggleMoreUsedBy );
			$hideMoreUsedBy = $( '.used-by .hide-more' ).on( 'click', toggleMoreUsedBy );
		}

		if ( $usesList.length > usesToShow ) {
			$usesList = $usesList.slice( usesToShow ).hide();

			$showMoreUses = $( '.uses .show-more' ).show().on( 'click', toggleMoreUses );
			$hideMoreUses = $( '.uses .hide-more' ).on( 'click', toggleMoreUses );
		}
	}

	function toggleMoreUses( event ) {
		event.preventDefault();

		$usesList.toggle();

		$showMoreUses.toggle();
		$hideMoreUses.toggle();
	}

	function toggleMoreUsedBy( event ) {
		event.preventDefault();

		$usedByList.toggle();

		$showMoreUsedBy.toggle();
		$hideMoreUsedBy.toggle();
	}

	toggleUsageListInit();

	// Runs before the highlight parsing is run.
	// `env` is defined here: https://github.com/PrismJS/prism/blob/2815f699970eb8387d741e3ac886845ce5439afb/prism.js#L583-L588
	Prism.hooks.add( 'before-highlight', function ( env ) {
		// If the code starts with `<`, it's either already got an opening tag,
		// or it starts with HTML. Either way, we don't want to inject here.
		if ( 'php' === env.language && ! env.code.startsWith( '<' ) ) {
			env.code = '<? ' + env.code;
			env.hasAddedTag = true;
		}
	} );

	// Runs before `highlightedCode` is set to the `innerHTML` of the container.
	Prism.hooks.add( 'before-insert', function ( env ) {
		if ( env.hasAddedTag ) {
			env.highlightedCode = env.highlightedCode.replace(
				'<span class="token delimiter important">&lt;?</span> ',
				''
			);
		}
	} );
} );
