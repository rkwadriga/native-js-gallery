export const createElement = (type, className, content = '') => {
    const element = document.createElement(type);
    element.classList.add(className);
    element.innerHTML = content;
    return element;
}

export const wrapElementByDiv = (element, className) => {
    const wrapperNode = createElement('div', className);
    element.parentNode.insertBefore(wrapperNode, element);
    wrapperNode.appendChild(element);
    return wrapperNode;
}

export const debounce = (func, time = 100) => {
    let timer;
    return function (event) {
        clearTimeout(timer);
        timer = setTimeout(func, time, event);
    };
}