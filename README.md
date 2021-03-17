# jCore

JavaScript library for building UI components

## Features

- Supports existing HTML without any special annotations
- Small, simple, and no transpiler
- Standalone, no dependencies

## Example

#### Toggle switches

[Demo](https://jsfiddle.net/f19p6yao/)

![Screen Shot](assets/toggle_switches.png)

#### Nested draggable boxes

[Demo](https://jsfiddle.net/23wqf1ce/)

![Screen Shot](assets/nested_draggable_boxes.png)

## Usage

```
<script src="jcore.js"></script>
```

Works on IE9+, Firefox, Safari, Chrome, Opera

## API

### Updating a DOM element

#### Component([element])

Get started with components by creating a custom component class.
You can set the existing DOM element as the element of the component.

```js
class MyComponent extends jCore.Component {
  constructor(el) {
    super(el);
  }
}

const el = document.getElementById('test');
const c = new MyComponent(el);

console.log(el === c.el);  // output: true
```

#### Component#el

A reference to the element of the component.

#### Component#render()

If none are set to a constructor of the component,
this method is called to create a element of the component.

```js
class MyComponent extends jCore.Component {
  constructor() {
    super();
  }

  render() {
    const el = document.createElement('div');
    el.textContent = 'test';
    return el;
  }
}

const c = new MyComponent();

console.log(c.el.textContent);  // output: "test"
```

#### Component#prop(value)

Return a getter/setter function that stores arbitrary data.
You can use this method to make a property of the component.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);

    // create each property as a getter-setter with initial value
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);
  }
}

const el = document.getElementById('rect');
const rect = new Rect(el, 0, 0, 200, 100);

// get the value of x
const a = rect.x(); // a == 0

// set the value of x
rect.x(50);

const b = rect.x(); // b == 50
```

#### Component#onredraw()

When you set a new value to a setter which is created by [*prop()*](#componentpropvalue),
this method is called at the next redraw cycle of the browser (achieved by window.requestAnimationFrame) to update DOM element.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);
  }

  onredraw() {
    // write code for updating element
    this.el.style.left = this.x() + 'px';
    this.el.style.top = this.y() + 'px';
    this.el.style.width = this.width() + 'px';
    this.el.style.height = this.height() + 'px';
  }
}

const el = document.getElementById('rect');
const rect = new Rect(el, 0, 0, 200, 100);

for (let i = 0; i < 10000; i++) {
  rect.x(100);
  rect.y(200);
  rect.width(300);
  rect.height(400);
}

// rect.onredraw() will be called only once
```

#### Component#redrawBy(...propertyNames, callback)

This is a helper method for updating DOM element in [*onredraw()*](#componentonredraw).
The given callback will be called when the property which is specified by its name is updated.
Passed arguments of the callback are the latest values of each property.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);
  }

  onredraw() {
    this.redrawBy('x', x => {
      // called when 'x' is updated
      this.el.style.left = x + 'px';
    });

    this.redrawBy('y', y => {
      // called when 'y' is updated
      this.el.style.top = y + 'px';
    });

    this.redrawBy('width', width => {
      // called when 'width' is updated
      this.el.style.width = width + 'px';
    });

    this.redrawBy('height', height => {
      // called when 'height' is updated
      this.el.style.height = height + 'px';
    });
  }
}
```

You will be able to change an implementation for updating DOM element without changing component's property names.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);
  }

  onredraw() {
    this.redrawBy('x', 'y', (x, y) => {
      // called when 'x' or 'y' is updated
      // use CSS property 'transform' to update a position of the component
      this.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });

    this.redrawBy('width', width => { this.el.style.width = width + 'px'; });
    this.redrawBy('height', height => { this.el.style.height = height + 'px'; });
  }
}
```

#### Component#markDirty()

If there are some updates without setting a new value to a setter created from [*prop()*](#componentpropvalue),
you can use this method to make a component ready for redrawing element.
After this method is called, [*redraw()*](#componentredraw) will be called at the next redraw cycle.

```js
class MultiLineText extends jCore.Component {
  constructor(el) {
    super(el);
    this.textList = [];
  }

  addText(text) {
    this.textList.push(text);

    // the content of 'textList' is updated and it needs to redraw
    this.markDirty();
  }

  onredraw() {
    this.el.innerHTML = this.textList.join('<br>');
  }
}
```

You will use this method for initial redrawing.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);

    // for initial redrawing
    this.markDirty();
  }

  onredraw() {
    this.redrawBy('x', 'y', (x, y) => {
      this.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
    this.redrawBy('width', width => { this.el.style.width = width + 'px'; });
    this.redrawBy('height', height => { this.el.style.height = height + 'px'; });
  }
}

const el = document.getElementById('rect');
const rect = new Rect(el, 0, 0, 200, 100);

// rect.onredraw() will be called
```

#### Component#redraw()

This method calls [*onredraw()*](#componentonredraw), and if a parent element of the component's element is changed by [*parentElement()*](#componentparentelementelementnull), applies DOM insertion or removal of the element to DOM tree.
You can use this method to update the element forcibly.
It is not recommended to override this method in custom components.

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);
  }

  onredraw() {
    this.redrawBy('x', 'y', (x, y) => {
      this.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
    this.redrawBy('width', width => { this.el.style.width = width + 'px'; });
    this.redrawBy('height', height => { this.el.style.height = height + 'px'; });
  }
}

const el = document.getElementById('rect');
const rect = new Rect(el, 0, 0, 200, 100);

// force initial redrawing
rect.redraw();
const a = window.getComputedStyle(rect.el).width;  // a == '200px'

// change the value of 'width'
rect.width(100);

const b = window.getComputedStyle(rect.el).width;  // b == '200px' (DOM element has not yet updated)

rect.redraw();
const c = window.getComputedStyle(rect.el).width;  // c == '100px'
```

### DOM insertion/removal

#### Component#parentElement(element|null)

Get or set a parent element of the component's element.
If you change a parent element, the component's element will be appended into the given parent element.
You cat set a parent element as null and the component's element will be removed from DOM tree.
This DOM insertion and removal is the only implicit changes to a DOM element in jCore library.

```js
class MyComponent extends jCore.Component {
  constructor() {
    super();
  }

  render() {
    const el = document.createElement('div');
    el.textContent = 'test';
    return el;
  }
}

const c = new MyComponent();
const parent = document.getElementById('parent');
c.parentElement(parent);

c.redraw();
console.log(c.el.parentNode === parent);  // output: true
```

#### Component#element(element)

Get or set the component's element.
If you set a new element, [*parentElement()*](#componentparentelementelementnull) is also called with the parent element of the element.
It is a rare case for calling this method.

#### Component#onappend()

This method is called when a element is appended into a parent element by calling [*parentElement()*](#componentparentelementelementnull).
You can override this method for registration of event listeners or loading resources and so on.

#### Component#onremove()

This method is called when a element is removed by calling [*parentElement()*](#componentparentelementelementnull).
You can override this method for unregistration of event listeners or releasing resources and so on.

```js
class ClickableComponent extends jCore.Component {
  constructor() {
    super();
    this.onclick = this.onclick.bind(this);
  }

  onappend() {
    this.el.addEventListener('click', this.onclick);
  }

  onremove() {
    this.el.removeEventListener('click', this.onclick);
  }

  onclick() {
    console.log('clicked');
  }
}
```

### Built-in event emitter

Components have similar methods of the [*EventEmitter*](https://nodejs.org/api/events.html#events_class_eventemitter) module found in Node.js as follows.

#### Component#on(type, listener)
#### Component#emit(type[, ...args])
#### Component#off(type, listener)
#### Component#removeAllListeners([type])

```js
class ClickableComponent extends jCore.Component {
  constructor() {
    super();
    this.onclick = this.onclick.bind(this);
    this.count = 0;
  }

  onappend() {
    this.el.addEventListener('click', this.onclick);
  }

  onremove() {
    this.el.removeEventListener('click', this.onclick);
  }

  onclick(event) {
    this.emit('click', ++this.count);
  }
}

const c = new ClickableComponent();

c.on('click', count => {
  console.log('clicked ' + count + ' times');
});
```

### Interaction with other components

#### Relation()

Changes of some components state is associated with changes of other components state.
jCore provides a unique approach for related changes on a group of components.
Every component can have a relation object that is used for updating other components when just before redrawing itself.

#### Relation#update(component)

This method is called just before the component which has a relation object is redrawing.
You can override this method and implement for the changes of related components. 

#### Component#addRelation(relation)

Add a relation object to a component.

#### Component#removeRelation(relation)

Remove a relation object from a component.

### Make draggable component

#### Draggable(component)

jCore provides a build-in module for making draggable component.
You make a custom draggable class and set a component to make it draggable.

#### Draggable#enable()

Activate the draggable module.
The module is not activated by default.

#### Draggable#disable()

Deactivate the draggable module.

#### Draggable#onstart(component, x, y, event, context)

Handler method to get event for drag start.

#### Draggable#onmove(component, x, y, event, context)

Handler method to get event for moving.

#### Draggable#onend(component, x, y, event, context)

Handler method to get event for drag end.

## Code example (Relation & Draggable)

- Create two components of rectangles
- The first rectangle is draggable
- The second rectangle moves related with the position of the first rectangle

[Demo](https://jsfiddle.net/gxpdbey0/)

```js
class Rect extends jCore.Component {
  constructor(el, x, y, width, height) {
    super(el);
    this.x = this.prop(x);
    this.y = this.prop(y);
    this.width = this.prop(width);
    this.height = this.prop(height);

    this.markDirty();
  }

  onredraw() {
    this.redrawBy('x', 'y', (x, y) => {
      this.el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    });
    this.redrawBy('width', width => { this.el.style.width = width + 'px'; });
    this.redrawBy('height', height => { this.el.style.height = height + 'px'; });
  }
}

class RectRelation extends jCore.Relation {
  constructor(targetRect) {
    super();
    this.targetRect = targetRect;
  }

  update(rect) {
    this.targetRect.x(rect.x() + 100);
    this.targetRect.y(rect.y() + 100);
  }
}

class RectDraggable extends jCore.Draggable {
  onstart(rect, x, y, event, context) {
    event.preventDefault();
    context.x = rect.x();
    context.y = rect.y();
  }

  onmove(rect, dx, dy, event, context) {
    rect.x(context.x + dx);
    rect.y(context.y + dy);
  }
}

const elements = document.querySelectorAll('.rect');
const first = new Rect(elements[0], 0, 0, 100, 50);
const second = new Rect(elements[1], 0, 0, 100, 50);

first.addRelation(new RectRelation(second));
new RectDraggable(first).enable();
```

## License

&copy; 2016 iOnStage
Licensed under the MIT License.
