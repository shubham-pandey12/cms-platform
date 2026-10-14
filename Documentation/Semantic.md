## Semantic Guidelines for Developers

- **Clarity First**  
  Write code, comments, and documentation that explain intent without relying on guesswork. Choose meaningful names for variables, functions, and components that reflect their responsibilities.

- **Consistency Matters**  
  Align with the project's established patterns, folder structures, and naming conventions. If you must introduce a new pattern, document it and ensure it complements existing practices.

- **Structure for Semantics**  
  Use HTML, JSX, and templating elements that describe the role of the content (e.g., headings for titles, lists for collections, buttons for actions). Favor semantic tags over generic containers.

- **Accessible by Design**  
  Ensure UI elements are reachable and understandable for assistive technologies. Provide proper labels, ARIA attributes when necessary, and respect keyboard navigation flows.

- **Document Intentional Deviations**  
  Whenever a semantic shortcut or workaround is unavoidable, leave a concise comment that justifies the decision and outlines future remediation if applicable.

- **Validate Data Contracts**  
  When integrating with APIs or services, clearly define the semantic meaning of payloads and validate inputs and outputs. Communicate any assumptions in code comments or interface definitions.

- **Test What You Declare**  
  Align tests with the semantic commitments of your code. If a component claims to render an accessible form, tests should verify the presence and behavior of labels, roles, and states.

- **Review with Semantics in Mind**  
  During code reviews, evaluate whether the semantics of components, functions, and data structures are preserved or improved. Flag ambiguous naming or misuse of structural elements.

- **Keep Documentation Live**  
  Update this guideline and related docs whenever semantics evolve. Treat documentation as a living contract that tracks the reasoning behind semantic decisions.

- **SSR and embed output**  
  HTML produced for server rendering (published pages, widget HTML embed fragments) should follow the same semantic structure and accessibility expectations as interactive in-app renderers: real headings, labels on controls, and appropriate roles—not a flat soup of `div`s unless there is a documented reason.

---

## HTML Examples

### Example 1: Semantic Structure vs Generic Containers

**❌ Bad - Using generic divs:**
```html
<div>
  <div>My Blog Post</div>
  <div>
    <div>Published: January 1, 2024</div>
    <div>Author: John Doe</div>
  </div>
  <div>
    <div>This is the first paragraph...</div>
    <div>This is the second paragraph...</div>
  </div>
</div>
```

**✅ Good - Using semantic HTML:**
```html
<article>
  <header>
    <h1>My Blog Post</h1>
    <div>
      <time datetime="2024-01-01">Published: January 1, 2024</time>
      <address>Author: John Doe</address>
    </div>
  </header>
  <main>
    <p>This is the first paragraph...</p>
    <p>This is the second paragraph...</p>
  </main>
</article>
```

### Example 2: Navigation and Lists

**❌ Bad - Using divs for navigation:**
```html
<div>
  <div>Home</div>
  <div>About</div>
  <div>Contact</div>
</div>
```

**✅ Good - Using semantic nav and list:**
```html
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

### Example 3: Forms with Proper Labels

**❌ Bad - Missing labels and semantic structure:**
```html
<div>
  <div>Email:</div>
  <input type="email" />
  <div>Password:</div>
  <input type="password" />
  <div>Submit</div>
</div>
```

**✅ Good - Semantic form with labels:**
```html
<form>
  <fieldset>
    <legend>Login</legend>
    <div>
      <label for="email">Email:</label>
      <input type="email" id="email" name="email" required aria-required="true" />
    </div>
    <div>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password" required aria-required="true" />
    </div>
    <button type="submit">Submit</button>
  </fieldset>
</form>
```

### Example 4: Buttons vs Clickable Divs

**❌ Bad - Using div as button:**
```html
<div onclick="handleClick()" style="cursor: pointer;">Click Me</div>
```

**✅ Good - Using semantic button:**
```html
<button type="button" onclick="handleClick()">Click Me</button>
```

### Example 5: Headings Hierarchy

**❌ Bad - Incorrect heading order:**
```html
<h1>Main Title</h1>
<h3>Subsection</h3>
<h2>Another Section</h2>
<h4>Sub-subsection</h4>
```

**✅ Good - Proper heading hierarchy:**
```html
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h2>Another Section</h2>
<h3>Subsection</h3>
<h4>Sub-subsection</h4>
```

### Example 6: Accessible Images

**❌ Bad - Missing alt text:**
```html
<img src="logo.png" />
```

**✅ Good - Descriptive alt text:**
```html
<img src="logo.png" alt="Company Logo - Acme Corporation" />
```

**✅ Good - Decorative image (empty alt):**
```html
<img src="decorative-line.png" alt="" role="presentation" />
```

### Example 7: Tables with Proper Structure

**❌ Bad - Missing semantic structure:**
```html
<table>
  <tr>
    <td>Name</td>
    <td>Age</td>
  </tr>
  <tr>
    <td>John</td>
    <td>30</td>
  </tr>
</table>
```

**✅ Good - Semantic table with headers:**
```html
<table>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Age</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John</td>
      <td>30</td>
    </tr>
  </tbody>
</table>
```

### Example 8: Document Structure

**❌ Bad - No semantic structure:**
```html
<div id="header">...</div>
<div id="content">...</div>
<div id="footer">...</div>
```

**✅ Good - Using semantic HTML5 elements:**
```html
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
  <aside>...</aside>
</main>
<footer>...</footer>
```

### Example 9: ARIA Attributes for Accessibility

**❌ Bad - Missing accessibility information:**
```html
<div onclick="toggleMenu()">Menu</div>
<div id="menu">Menu items...</div>
```

**✅ Good - With ARIA attributes:**
```html
<button 
  type="button" 
  aria-expanded="false" 
  aria-controls="menu"
  onclick="toggleMenu()">
  Menu
</button>
<nav id="menu" aria-label="Main navigation" hidden>
  <ul>Menu items...</ul>
</nav>
```

### Example 10: Documenting Intentional Deviations

**✅ Good - Documented workaround:**
```html
<!-- 
  Using div instead of button here due to legacy CSS framework 
  that doesn't support button styling. TODO: Refactor when 
  migrating to new design system.
-->
<div class="btn-legacy" role="button" tabindex="0" aria-label="Submit form">
  Submit
</div>
```

---

## References

- [HTML5 Semantic Elements - W3Schools](https://www.w3schools.com/html/html5_semantic_elements.asp)
- [Semantic HTML - web.dev](https://web.dev/learn/html/semantic-html)
