// CSS-classes
const GalleryClassName = '__rknjg-gallery';
const GalleryDraggableClassName = '__rknjg-gallery-draggable';
const GalleryLineClassName = '__rknjg-gallery-line';
const GalleryLineContainerClassName = '__rknjg-gallery-line-container';
const GallerySlideClassName = '__rknjg-gallery-slide';
const GalleryNavClassName = '__rknjg-gallery-nav';
const GalleryNavLeftClassName = '__rknjg-gallery-nav-left';
const GalleryNavRightClassName = '__rknjg-gallery-nav-right';
const GalleryNavDisabledClassName = '__rknjg-gallery-nav-disabled';
const GalleryDotsClassName = '__rknjg-gallery-dots';
const GalleryDotClassName = '__rknjg-gallery-dot';
const GalleryActiveDotClassName = '__rknjg-gallery-active-dot';

// Helpers
import { createElement, wrapElementByDiv, debounce } from "./helpers";

export class Gallery {
    constructor(element, options = {}) {
        this.containerNode = element;
        this.size = element.childElementCount;
        this.prevSlide = 0;
        this.currentSlide = 0;
        this.settings = {
            margin: options.margin || 10,
            sensitivity: options.sensitivity || 40,
            speed: options.speed !== undefined ? (1 / options.speed) : 0.5,
            autoSpeed: options.autoSpeed !== undefined ? options.autoSpeed : 1,
            dots: options.dots !== undefined ? options.dots : true
        }

        // Bind "this" for all methods - they should work correctly in any context
        this.manageHTML = this.manageHTML.bind(this);
        this.setParameters = this.setParameters.bind(this);
        this.setEvents = this.setEvents.bind(this);
        this.resizeGallery = this.resizeGallery.bind(this);
        this.destroyEvents = this.destroyEvents.bind(this);
        this.setStylePosition = this.setStylePosition.bind(this);
        this.setStyleTransition = this.setStyleTransition.bind(this);
        this.resetStyleTransition = this.resetStyleTransition.bind(this);
        this.changeCurrentSlide = this.changeCurrentSlide.bind(this);
        this.changeDisabledNav = this.changeDisabledNav.bind(this);
        this.autoScroll = this.autoScroll.bind(this);
        this.startDrag = this.startDrag.bind(this);
        this.stopDrag = this.stopDrag.bind(this);
        this.dragging = this.dragging.bind(this);
        this.clickDots = this.clickDots.bind(this);
        this.clickLeft = this.clickLeft.bind(this);
        this.clickRight = this.clickRight.bind(this);

        // Change the slide HTML to more comfortable view
        this.manageHTML();
        // Calculate elements widths
        this.setParameters();
        // Add user's events listeners
        this.setEvents();
        // Start auto scroll if it's enabled
        if (this.settings.autoSpeed > 0) {
            this.autoScroll();
        }
    }

    manageHTML() {
        // Add the "gallery" class to the gallery container
        this.containerNode.classList.add(GalleryClassName);

        // Cover the galley content to the "gallery-line" container
        this.lineNode = createElement('div', GalleryLineClassName);
        this.lineNode.innerHTML = this.containerNode.innerHTML;
        this.containerNode.innerHTML = '';
        this.containerNode.appendChild(this.lineNode);

        // Cover the slides line to ".gallery-line-container" container
        this.lineContainerNode = wrapElementByDiv(this.lineNode, GalleryLineContainerClassName);

        // Wrap all gallery slides to the "gallery-slide" container
        this.slideNodes = Array.from(this.lineNode.children).map(childNode => wrapElementByDiv(childNode, GallerySlideClassName));

        // Add "right" and "left" buttons to the gallery container
        const navNode = createElement('div', GalleryNavClassName);
        this.btnLeftNode = createElement('button', GalleryNavLeftClassName);
        this.btnRightNode = createElement('button', GalleryNavRightClassName);
        navNode.appendChild(this.btnLeftNode);
        navNode.appendChild(this.btnRightNode);
        this.containerNode.appendChild(navNode);

        // Generate slides dots and dd them to the gallery container
        this.dotsNodes = [];
        if (this.settings.dots) {
            this.dotsNode = createElement('div', GalleryDotsClassName);
            Array.from(Array(this.size).keys()).forEach(key => {
                const dotNode = createElement('button', GalleryDotClassName);
                dotNode.dataset.index = String(key);
                if (key === this.currentSlide) {
                    dotNode.classList.add(GalleryActiveDotClassName);
                }
                this.dotsNode.appendChild(dotNode);
                this.dotsNodes.push(dotNode);
            });
            this.containerNode.appendChild(this.dotsNode);
        }
    }

    setParameters() {
        // Calculate start scrolling positions
        const coordsLineContainer = this.lineContainerNode.getBoundingClientRect();
        this.width = coordsLineContainer.width;
        this.X = -this.currentSlide * (this.width + this.settings.margin);
        this.maximumX = -(this.size - 1) * (this.width + this.settings.margin);

        // Set sizes of slides container and slides
        this.resetStyleTransition();
        this.lineNode.style.width = `${this.width * (this.size + this.settings.margin)}px`;
        this.setStylePosition();
        Array.from(this.slideNodes).forEach(slideNode => {
            slideNode.style.width = `${this.width}px`;
            slideNode.style.marginRight = `${this.settings.margin}px`;
        });

        // Disable the left nav button
        this.changeDisabledNav();
    }

    setEvents() {
        this.eventListeners = [
            {name: 'resize', callback: debounce(this.resizeGallery)},
            {name: 'pointerdown', callback: this.startDrag, target: this.lineNode},
            {name: 'pointerup', callback: this.stopDrag},
            {name: 'pointercancel', callback: this.stopDrag},
            {name: 'click', callback: this.clickLeft, target: this.btnLeftNode},
            {name: 'click', callback: this.clickRight, target: this.btnRightNode}
        ];
        if (this.dotsNode !== undefined) {
            this.eventListeners.push({name: 'click', callback: this.clickDots, target: this.dotsNode});
        }
        this.eventListeners.forEach(listener => {
            if (listener.target === undefined) {
                listener.target = window;
            }
            listener.target.addEventListener(listener.name, listener.callback);
        });
    }

    destroyEvents() {
        this.eventListeners.forEach(listener => listener.target.removeEventListener(listener.name, listener.callback));
    }

    autoScroll() {
        setInterval(() => {
            let countSwipes = 1;
            if (this.currentSlide < this.size - 1) {
                this.currentSlide++;
            } else {
                countSwipes = 0;
                this.currentSlide = 0;
            }
            this.changeCurrentSlide(countSwipes);
        }, 5000 / this.settings.autoSpeed);
    }

    setStyleTransition(countSwipes = 1) {
        this.lineNode.style.transition = `all ${this.settings.speed * countSwipes}s ease 0s`;
    }

    setStylePosition() {
        this.lineNode.style.transform = `translate3d(${this.X}px, 0, 0)`;
    }

    resetStyleTransition() {
        this.lineNode.style.transition = 'all 0s ease 0s';
    }

    changeDisabledNav() {
        if (this.currentSlide === 0) {
            this.btnLeftNode.classList.add(GalleryNavDisabledClassName);
        } else {
            this.btnLeftNode.classList.remove(GalleryNavDisabledClassName);
        }
        if (this.currentSlide === this.size - 1) {
            this.btnRightNode.classList.add(GalleryNavDisabledClassName);
        } else {
            this.btnRightNode.classList.remove(GalleryNavDisabledClassName);
        }
    }

    changeCurrentSlide(countSwipes = 1) {
        this.X = -this.currentSlide * (this.width + this.settings.margin);
        this.setStyleTransition(countSwipes);
        this.setStylePosition();
        this.changeDisabledNav();
        // Remove "active" class from the old active dot and add to the new one
        if (this.dotsNodes.length > 0) {
            this.dotsNodes[this.prevSlide].classList.remove(GalleryActiveDotClassName);
            this.dotsNodes[this.currentSlide].classList.add(GalleryActiveDotClassName);
        }
        this.prevSlide = this.currentSlide;
    }

    // <-- Events listeners -->

    resizeGallery() {
        // Re-calculate elements widths
        this.setParameters();
    }

    startDrag(event) {
        this.clickX = event.pageX;
        this.startX = this.X;
        this.dragShift = 0;
        this.currentSlideWasChanged = false;
        this.resetStyleTransition();
        this.containerNode.classList.add(GalleryDraggableClassName);
        window.addEventListener('pointermove', this.dragging);
    }

    dragging(event) {
        this.dragShift = event.pageX - this.clickX;
        const easing = this.dragShift / 5;
        this.X = Math.max(
            Math.min(this.startX + this.dragShift, easing),
            this.maximumX + easing
        );
        this.setStylePosition();
    }

    stopDrag() {
        // Swipe to the right
        if (this.dragShift > this.settings.sensitivity && this.currentSlide > 0 && !this.currentSlideWasChanged) {
            this.currentSlide -= 1;
            this.currentSlideWasChanged = true;
        }
        // Swipe to the left
        if (this.dragShift < -this.settings.sensitivity && this.currentSlide < this.size - 1 && !this.currentSlideWasChanged) {
            this.currentSlide += 1;
            this.currentSlideWasChanged = true;
        }

        // Remove the "draggable" class from gallery container and remember the new selected slide
        this.containerNode.classList.remove(GalleryDraggableClassName);
        this.changeCurrentSlide();
        window.removeEventListener('pointermove', this.dragging);
    }

    clickDots(event) {
        const dotNode = event.target.closest('button');
        if (!dotNode) {
            return;
        }
        const index = Number(dotNode.dataset.index);
        if (index !== this.currentSlide) {
            const countSwipes = Math.abs(this.currentSlide - index);
            this.currentSlide = index;
            this.changeCurrentSlide(countSwipes);
        }
    }

    clickLeft() {
        if (this.currentSlide === 0) {
            return;
        }
        this.currentSlide--;
        this.changeCurrentSlide();
    }

    clickRight() {
        if (this.currentSlide >= this.size - 1) {
            return;
        }
        this.currentSlide++;
        this.changeCurrentSlide();
    }

    // <-- END Events listeners -->
}