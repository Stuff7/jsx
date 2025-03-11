import type { BoolAttr, ReactiveAttr } from "./signals";
import type {
  Option,
  Binders,
  CSSProperties,
  SpecialProps,
  EventHandlers,
} from "./dom-utils";

type HTMLAttributeAnchorTarget =
  | "_self"
  | "_blank"
  | "_parent"
  | "_top"
  | (string & NonNullable<unknown>);

type HTMLAttributeReferrerPolicy =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";
//

interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
  // biome-ignore lint/suspicious/noExplicitAny:
  download?: Option<any>;
  href?: Option<string>;
  hreflang?: Option<string>;
  media?: Option<string>;
  ping?: Option<string>;
  target?: Option<HTMLAttributeAnchorTarget>;
  type?: Option<string>;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
}

interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: Option<string>;
  coords?: Option<string>;
  // biome-ignore lint/suspicious/noExplicitAny:
  download?: Option<any>;
  href?: Option<string>;
  hreflang?: Option<string>;
  media?: Option<string>;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
  shape?: Option<string>;
  target?: Option<string>;
}

interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
  href?: Option<string>;
  target?: Option<string>;
}

interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: Option<string>;
}

interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: Option<boolean>;
  form?: Option<string>;
  formaction?:
  | string
  | NonNullable<unknown>[keyof NonNullable<unknown>]
  | undefined;
  formenctype?: Option<string>;
  formmethod?: Option<string>;
  formnovalidate?: Option<boolean>;
  formtarget?: Option<string>;
  name?: Option<string>;
  type?: Option<"submit" | "reset" | "button">;
  value?: Option<string | readonly string[] | number>;
}

interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: Option<number | string>;
  width?: Option<number | string>;
}

interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: Option<number>;
  width?: Option<number | string>;
}

interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: Option<number>;
}

interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Option<string | readonly string[] | number>;
}

interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
  open?: Option<boolean>;
  name?: Option<string>;
}

interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: Option<string>;
  datetime?: Option<string>;
}

interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
  open?: Option<boolean>;
}

interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: Option<number | string>;
  src?: Option<string>;
  type?: Option<string>;
  width?: Option<number | string>;
}

interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: Option<boolean>;
  form?: Option<string>;
  name?: Option<string>;
}

interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
  "accept-charset"?: Option<string>;
  action?:
  | string
  | undefined
  | NonNullable<unknown>[keyof NonNullable<unknown>];
  autocomplete?: Option<string>;
  enctype?: Option<string>;
  method?: Option<string>;
  name?: Option<string>;
  novalidate?: Option<boolean>;
  target?: Option<string>;
}

interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
  manifest?: Option<string>;
}

interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
  allow?: Option<string>;
  allowfullscreen?: Option<boolean>;
  allowtransparency?: Option<boolean>;
  /** @deprecated */
  frameborder?: Option<number | string>;
  height?: Option<number | string>;
  loading?: Option<"eager" | "lazy">;
  /** @deprecated */
  marginheight?: Option<number>;
  /** @deprecated */
  marginwidth?: Option<number>;
  name?: Option<string>;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
  sandbox?: Option<string>;
  /** @deprecated */
  scrolling?: Option<string>;
  seamless?: Option<boolean>;
  src?: Option<string>;
  srcdoc?: Option<string>;
  width?: Option<number | string>;
}

type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;

interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: Option<string>;
  crossorigin?: Option<CrossOrigin>;
  decoding?: Option<"async" | "auto" | "sync">;
  fetchpriority?: Option<"high" | "low" | "auto">;
  height?: Option<number | string>;
  loading?: Option<"eager" | "lazy">;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
  sizes?: Option<string>;
  src?: Option<string>;
  srcset?: Option<string>;
  usemap?: Option<string>;
  width?: Option<number | string>;
}

interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: Option<string>;
  datetime?: Option<string>;
}

type HTMLInputTypeAttribute =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"
  | (string & NonNullable<unknown>);

type AutoFillAddressKind = "billing" | "shipping";
type AutoFillBase = "" | "off" | "on";
type AutoFillContactField =
  | "email"
  | "tel"
  | "tel-area-code"
  | "tel-country-code"
  | "tel-extension"
  | "tel-local"
  | "tel-local-prefix"
  | "tel-local-suffix"
  | "tel-national";
type AutoFillContactKind = "home" | "mobile" | "work";
type AutoFillCredentialField = "webauthn";
type AutoFillNormalField =
  | "additional-name"
  | "address-level1"
  | "address-level2"
  | "address-level3"
  | "address-level4"
  | "address-line1"
  | "address-line2"
  | "address-line3"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-family-name"
  | "cc-given-name"
  | "cc-name"
  | "cc-number"
  | "cc-type"
  | "country"
  | "country-name"
  | "current-password"
  | "family-name"
  | "given-name"
  | "honorific-prefix"
  | "honorific-suffix"
  | "name"
  | "new-password"
  | "one-time-code"
  | "organization"
  | "postal-code"
  | "street-address"
  | "transaction-amount"
  | "transaction-currency"
  | "username";
type OptionalPrefixToken<T extends string> = `${T} ` | "";
type OptionalPostfixToken<T extends string> = ` ${T}` | "";
type AutoFillField =
  | AutoFillNormalField
  | `${OptionalPrefixToken<AutoFillContactKind>}${AutoFillContactField}`;
type AutoFillSection = `section-${string}`;
type AutoFill =
  | AutoFillBase
  | `${OptionalPrefixToken<AutoFillSection>}${OptionalPrefixToken<AutoFillAddressKind>}${AutoFillField}${OptionalPostfixToken<AutoFillCredentialField>}`;
type HTMLInputAutoCompleteAttribute =
  | AutoFill
  | (string & NonNullable<unknown>);

interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
  accept?: Option<string>;
  alt?: Option<string>;
  autocomplete?: Option<HTMLInputAutoCompleteAttribute>;
  capture?: Option<boolean | "user" | "environment">; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
  checked?: Option<boolean>;
  disabled?: Option<boolean>;
  enterkeyhint?: Option<
    "enter" | "done" | "go" | "next" | "previous" | "search" | "send"
  >;
  form?: Option<string>;
  formaction?: string | NonNullable<unknown> | undefined;
  formenctype?: Option<string>;
  formmethod?: Option<string>;
  formnovalidate?: Option<boolean>;
  formtarget?: Option<string>;
  height?: Option<number | string>;
  list?: Option<string>;
  max?: Option<number | string>;
  maxlength?: Option<number>;
  min?: Option<number | string>;
  minlength?: Option<number>;
  multiple?: Option<boolean>;
  name?: Option<string>;
  pattern?: Option<string>;
  placeholder?: Option<string>;
  readonly?: Option<boolean>;
  required?: Option<boolean>;
  size?: Option<number>;
  src?: Option<string>;
  step?: Option<number | string>;
  type?: Option<HTMLInputTypeAttribute>;
  value?: Option<string | readonly string[] | number>;
  webkitdirectory?: Option<boolean>;
  width?: Option<number | string>;
}

interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
  challenge?: Option<string>;
  disabled?: Option<boolean>;
  form?: Option<string>;
  keytype?: Option<string>;
  keyparams?: Option<string>;
  name?: Option<string>;
}

interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: Option<string>;
  for?: Option<string>;
  htmlFor?: Option<string>;
}

interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: Option<string | readonly string[] | number>;
}

interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
  as?: Option<string>;
  crossorigin?: Option<CrossOrigin>;
  fetchpriority?: Option<"high" | "low" | "auto">;
  href?: Option<string>;
  hreflang?: Option<string>;
  integrity?: Option<string>;
  media?: Option<string>;
  imagesrcset?: Option<string>;
  imagesizes?: Option<string>;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
  sizes?: Option<string>;
  type?: Option<string>;
  charset?: Option<string>;
}

interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: Option<string>;
}

interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
  type?: Option<string>;
}

interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
  autoplay?: Option<boolean>;
  controls?: Option<boolean>;
  controlslist?: Option<string>;
  crossorigin?: Option<CrossOrigin>;
  loop?: Option<boolean>;
  mediagroup?: Option<string>;
  muted?: Option<boolean>;
  playsinline?: Option<boolean>;
  preload?: Option<string>;
  src?: Option<string>;
}

interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
  charset?: Option<string>;
  content?: Option<string>;
  "http-equiv"?: Option<string>;
  media?: Option<string>;
  name?: Option<string>;
}

interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: Option<string>;
  high?: Option<number>;
  low?: Option<number>;
  max?: Option<number | string>;
  min?: Option<number | string>;
  optimum?: Option<number>;
  value?: Option<string | readonly string[] | number>;
}

interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: Option<string>;
}

interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
  classid?: Option<string>;
  data?: Option<string>;
  form?: Option<string>;
  height?: Option<number | string>;
  name?: Option<string>;
  type?: Option<string>;
  usemap?: Option<string>;
  width?: Option<number | string>;
  wmode?: Option<string>;
}

interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
  reversed?: Option<boolean>;
  start?: Option<number>;
  type?: Option<"1" | "a" | "A" | "i" | "I">;
}

interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: Option<boolean>;
  label?: Option<string>;
}

interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: Option<boolean>;
  label?: Option<string>;
  selected?: Option<boolean>;
  value?: Option<string | readonly string[] | number>;
}

interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: Option<string>;
  for?: Option<string>;
  htmlFor?: Option<string>;
  name?: Option<string>;
}

interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: Option<string>;
  value?: Option<string | readonly string[] | number>;
}

interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
  max?: Option<number | string>;
  value?: Option<string | readonly string[] | number>;
}

interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: Option<string>;
}

interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
  async?: Option<boolean>;
  /** @deprecated */
  charset?: Option<string>;
  crossorigin?: CrossOrigin;
  defer?: Option<boolean>;
  integrity?: Option<string>;
  nomodule?: Option<boolean>;
  referrerpolicy?: Option<HTMLAttributeReferrerPolicy>;
  src?: Option<string>;
  type?: Option<string>;
}

interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
  autocomplete?: Option<string>;
  disabled?: Option<boolean>;
  form?: Option<string>;
  multiple?: Option<boolean>;
  name?: Option<string>;
  required?: Option<boolean>;
  size?: Option<number>;
  value?: Option<string | readonly string[] | number>;
}

interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: Option<number | string>;
  media?: Option<string>;
  sizes?: Option<string>;
  src?: Option<string>;
  srcset?: Option<string>;
  type?: Option<string>;
  width?: Option<number | string>;
}

interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
  media?: Option<string>;
  scoped?: Option<boolean>;
  type?: Option<string>;
}

interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: Option<"left" | "center" | "right">;
  bgcolor?: Option<string>;
  border?: Option<number>;
  cellpadding?: Option<number | string>;
  cellspacing?: Option<number | string>;
  frame?: Option<boolean>;
  rules?: Option<"none" | "groups" | "rows" | "columns" | "all">;
  summary?: Option<string>;
  width?: Option<number | string>;
}

interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
  autocomplete?: Option<string>;
  cols?: Option<number>;
  dirname?: Option<string>;
  disabled?: Option<boolean>;
  form?: Option<string>;
  maxlength?: Option<number>;
  minlength?: Option<number>;
  name?: Option<string>;
  placeholder?: Option<string>;
  readonly?: Option<boolean>;
  required?: Option<boolean>;
  rows?: Option<number>;
  value?: Option<string | readonly string[] | number>;
  wrap?: Option<string>;
}

interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: Option<"left" | "center" | "right" | "justify" | "char">;
  colspan?: Option<number>;
  headers?: Option<string>;
  rowspan?: Option<number>;
  scope?: Option<string>;
  abbr?: Option<string>;
  height?: Option<number | string>;
  width?: Option<number | string>;
  valign?: Option<"top" | "middle" | "bottom" | "baseline">;
}

interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: Option<"left" | "center" | "right" | "justify" | "char">;
  colspan?: Option<number>;
  headers?: Option<string>;
  rowspan?: Option<number>;
  scope?: Option<string>;
  abbr?: Option<string>;
}

interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
  datetime?: Option<string>;
}

interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
  default?: Option<boolean>;
  kind?: Option<string>;
  label?: Option<string>;
  src?: Option<string>;
  srclang?: Option<string>;
}

interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
  height?: Option<number | string>;
  playsinline?: Option<boolean>;
  poster?: Option<string>;
  width?: Option<number | string>;
  disablepictureinpicture?: Option<boolean>;
  disableremoteplayback?: Option<boolean>;
}

interface AriaAttributes {
  /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
  "aria-activedescendant"?: Option<string>;
  /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
  "aria-atomic"?: Option<BoolAttr>;
  /**
   * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
   * presented if they are made.
   */
  "aria-autocomplete"?: Option<"none" | "inline" | "list" | "both">;
  /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
  /**
   * Defines a string value that labels the current element, which is intended to be converted into Braille.
   * @see aria-label.
   */
  "aria-braillelabel"?: Option<string>;
  /**
   * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
   * @see aria-roledescription.
   */
  "aria-brailleroledescription"?: Option<string>;
  "aria-busy"?: Option<BoolAttr>;
  /**
   * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
   * @see aria-pressed @see aria-selected.
   */
  "aria-checked"?: Option<boolean | "false" | "mixed" | "true">;
  /**
   * Defines the total number of columns in a table, grid, or treegrid.
   * @see aria-colindex.
   */
  "aria-colcount"?: Option<number>;
  /**
   * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
   * @see aria-colcount @see aria-colspan.
   */
  "aria-colindex"?: Option<number>;
  /**
   * Defines a human readable text alternative of aria-colindex.
   * @see aria-rowindextext.
   */
  "aria-colindextext"?: Option<string>;
  /**
   * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-colindex @see aria-rowspan.
   */
  "aria-colspan"?: Option<number>;
  /**
   * Identifies the element (or elements) whose contents or presence are controlled by the current element.
   * @see aria-owns.
   */
  "aria-controls"?: Option<string>;
  /** Indicates the element that represents the current item within a container or set of related elements. */
  "aria-current"?: Option<
    boolean | "false" | "true" | "page" | "step" | "location" | "date" | "time"
  >;
  /**
   * Identifies the element (or elements) that describes the object.
   * @see aria-labelledby
   */
  "aria-describedby"?: Option<string>;
  /**
   * Defines a string value that describes or annotates the current element.
   * @see related aria-describedby.
   */
  "aria-description"?: Option<string>;
  /**
   * Identifies the element that provides a detailed, extended description for the object.
   * @see aria-describedby.
   */
  "aria-details"?: Option<string>;
  /**
   * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
   * @see aria-hidden @see aria-readonly.
   */
  "aria-disabled"?: Option<BoolAttr>;
  /**
   * Indicates what functions can be performed when a dragged object is released on the drop target.
   * @deprecated in ARIA 1.1
   */
  "aria-dropeffect"?: Option<
    "none" | "copy" | "execute" | "link" | "move" | "popup"
  >;
  /**
   * Identifies the element that provides an error message for the object.
   * @see aria-invalid @see aria-describedby.
   */
  "aria-errormessage"?: Option<string>;
  /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
  "aria-expanded"?: Option<BoolAttr>;
  /**
   * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
   * allows assistive technology to override the general default of reading in document source order.
   */
  "aria-flowto"?: Option<string>;
  /**
   * Indicates an element's "grabbed" state in a drag-and-drop operation.
   * @deprecated in ARIA 1.1
   */
  "aria-grabbed"?: Option<BoolAttr>;
  /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
  "aria-haspopup"?: Option<
    boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog"
  >;
  /**
   * Indicates whether the element is exposed to an accessibility API.
   * @see aria-disabled.
   */
  "aria-hidden"?: Option<BoolAttr>;
  /**
   * Indicates the entered value does not conform to the format expected by the application.
   * @see aria-errormessage.
   */
  "aria-invalid"?: Option<boolean | "false" | "true" | "grammar" | "spelling">;
  /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
  "aria-keyshortcuts"?: Option<string>;
  /**
   * Defines a string value that labels the current element.
   * @see aria-labelledby.
   */
  "aria-label"?: Option<string>;
  /**
   * Identifies the element (or elements) that labels the current element.
   * @see aria-describedby.
   */
  "aria-labelledby"?: Option<string>;
  /** Defines the hierarchical level of an element within a structure. */
  "aria-level"?: Option<number>;
  /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
  "aria-live"?: Option<"off" | "assertive" | "polite">;
  /** Indicates whether an element is modal when displayed. */
  "aria-modal"?: Option<BoolAttr>;
  /** Indicates whether a text box accepts multiple lines of input or only a single line. */
  "aria-multiline"?: Option<BoolAttr>;
  /** Indicates that the user may select more than one item from the current selectable descendants. */
  "aria-multiselectable"?: Option<BoolAttr>;
  /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
  "aria-orientation"?: Option<"horizontal" | "vertical">;
  /**
   * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
   * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
   * @see aria-controls.
   */
  "aria-owns"?: Option<string>;
  /**
   * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
   * A hint could be a sample value or a brief description of the expected format.
   */
  "aria-placeholder"?: Option<string>;
  /**
   * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-setsize.
   */
  "aria-posinset"?: Option<number>;
  /**
   * Indicates the current "pressed" state of toggle buttons.
   * @see aria-checked @see aria-selected.
   */
  "aria-pressed"?: Option<boolean | "false" | "mixed" | "true">;
  /**
   * Indicates that the element is not editable, but is otherwise operable.
   * @see aria-disabled.
   */
  "aria-readonly"?: Option<BoolAttr>;
  /**
   * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
   * @see aria-atomic.
   */
  "aria-relevant"?: Option<
    | "additions"
    | "additions removals"
    | "additions text"
    | "all"
    | "removals"
    | "removals additions"
    | "removals text"
    | "text"
    | "text additions"
    | "text removals"
  >;
  /** Indicates that user input is required on the element before a form may be submitted. */
  "aria-required"?: Option<BoolAttr>;
  /** Defines a human-readable, author-localized description for the role of an element. */
  "aria-roledescription"?: Option<string>;
  /**
   * Defines the total number of rows in a table, grid, or treegrid.
   * @see aria-rowindex.
   */
  "aria-rowcount"?: Option<number>;
  /**
   * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
   * @see aria-rowcount @see aria-rowspan.
   */
  "aria-rowindex"?: Option<number>;
  /**
   * Defines a human readable text alternative of aria-rowindex.
   * @see aria-colindextext.
   */
  "aria-rowindextext"?: Option<string>;
  /**
   * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-rowindex @see aria-colspan.
   */
  "aria-rowspan"?: Option<number>;
  /**
   * Indicates the current "selected" state of various widgets.
   * @see aria-checked @see aria-pressed.
   */
  "aria-selected"?: Option<BoolAttr>;
  /**
   * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-posinset.
   */
  "aria-setsize"?: Option<number>;
  /** Indicates if items in a table or grid are sorted in ascending or descending order. */
  "aria-sort"?: Option<"none" | "ascending" | "descending" | "other">;
  /** Defines the maximum allowed value for a range widget. */
  "aria-valuemax"?: Option<number>;
  /** Defines the minimum allowed value for a range widget. */
  "aria-valuemin"?: Option<number>;
  /**
   * Defines the current value for a range widget.
   * @see aria-valuetext.
   */
  "aria-valuenow"?: Option<number>;
  /** Defines the human readable text alternative of aria-valuenow for a range widget. */
  "aria-valuetext"?: Option<string>;
}

// All the WAI-ARIA 1.1 role attribute values from https://www.w3.org/TR/wai-aria-1.1/#role_definitions
type AriaRole =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "button"
  | "cell"
  | "checkbox"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "dialog"
  | "directory"
  | "document"
  | "feed"
  | "figure"
  | "form"
  | "grid"
  | "gridcell"
  | "group"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listbox"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "menu"
  | "menubar"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "none"
  | "note"
  | "option"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "switch"
  | "tab"
  | "table"
  | "tablist"
  | "tabpanel"
  | "term"
  | "textbox"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem"
  | (string & NonNullable<unknown>);

type DOMAttributes<T> = SpecialProps &
  EventHandlers<T> & {
    children?: Option<Node | Node[]>;
    innerHTML?: Option<string>;
  };

interface SVGAttributes<T> extends AriaAttributes, Partial<DOMAttributes<T>> {
  // Attributes which are also defined in HTMLAttributes
  class?: Option<ReactiveAttr>;
  color?: Option<string>;
  height?: Option<number | string>;
  id?: Option<string>;
  lang?: Option<string>;
  max?: Option<number | string>;
  media?: Option<string>;
  method?: Option<string>;
  min?: Option<number | string>;
  name?: Option<string>;
  style?: Option<CSSProperties>;
  target?: Option<string>;
  type?: Option<string>;
  width?: Option<number | string>;

  // Other HTML properties supported by SVG elements in browsers
  role?: Option<AriaRole>;
  tabindex?: Option<number>;
  crossorigin?: Option<CrossOrigin>;

  // SVG Specific attributes
  "accent-height"?: Option<number | string>;
  accumulate?: Option<"none" | "sum">;
  additive?: Option<"replace" | "sum">;
  "alignment-baseline"?: Option<
    | "auto"
    | "baseline"
    | "before-edge"
    | "text-before-edge"
    | "middle"
    | "central"
    | "after-edge"
    | "text-after-edge"
    | "ideographic"
    | "alphabetic"
    | "hanging"
    | "mathematical"
    | "inherit"
  >;
  alphabetic?: Option<number | string>;
  amplitude?: Option<number | string>;
  "arabic-form"?: Option<"initial" | "medial" | "terminal" | "isolated">;
  ascent?: Option<number | string>;
  attributeName?: Option<string>;
  attributeType?: Option<string>;
  azimuth?: Option<number | string>;
  baseFrequency?: Option<number | string>;
  "baseline-shift"?: Option<number | string>;
  baseProfile?: Option<number | string>;
  bbox?: Option<number | string>;
  begin?: Option<number | string>;
  bias?: Option<number | string>;
  by?: Option<number | string>;
  calcMode?: Option<number | string>;
  "cap-height"?: Option<number | string>;
  clip?: Option<number | string>;
  "clip-path"?: Option<string>;
  "clip-rule"?: Option<number | string>;
  "color-interpolation"?: Option<number | string>;
  "color-interpolation-filters"?: Option<
    "auto" | "sRGB" | "linearRGB" | "inherit"
  >;
  "color-profile"?: Option<number | string>;
  "color-rendering"?: Option<number | string>;
  "content-script-type"?: Option<number | string>;
  "content-style-type"?: Option<number | string>;
  cursor?: Option<number | string>;
  cx?: Option<number | string>;
  cy?: Option<number | string>;
  d?: Option<string>;
  decelerate?: Option<number | string>;
  descent?: Option<number | string>;
  diffuseConstant?: Option<number | string>;
  direction?: Option<number | string>;
  display?: Option<number | string>;
  divisor?: Option<number | string>;
  "dominant-baseline"?: Option<number | string>;
  dur?: Option<number | string>;
  dx?: Option<number | string>;
  dy?: Option<number | string>;
  edgeMode?: Option<number | string>;
  elevation?: Option<number | string>;
  "enable-background"?: Option<number | string>;
  end?: Option<number | string>;
  exponent?: Option<number | string>;
  "external-resources-required"?: Option<BoolAttr>;
  fill?: Option<string>;
  "fill-opacity"?: Option<number | string>;
  "fill-rule"?: Option<"nonzero" | "evenodd" | "inherit">;
  filter?: Option<string>;
  "flood-color"?: Option<number | string>;
  "flood-opacity"?: Option<number | string>;
  focusable?: Option<BoolAttr | "auto">;
  "font-family"?: Option<string>;
  "font-size"?: Option<number | string>;
  "font-size-adjust"?: Option<number | string>;
  "font-stretch"?: Option<number | string>;
  "font-style"?: Option<number | string>;
  "font-variant"?: Option<number | string>;
  "font-weight"?: Option<number | string>;
  format?: Option<number | string>;
  fr?: Option<number | string>;
  from?: Option<number | string>;
  fx?: Option<number | string>;
  fy?: Option<number | string>;
  g1?: Option<number | string>;
  g2?: Option<number | string>;
  "glyph-name"?: Option<number | string>;
  "glyph-orientation-horizontal"?: Option<number | string>;
  "glyph-orientation-vertical"?: Option<number | string>;
  "glyph-ref"?: Option<number | string>;
  gradientTransform?: Option<string>;
  gradientUnits?: Option<string>;
  hanging?: Option<number | string>;
  "horiz-adv-x"?: Option<number | string>;
  "horiz-origin-x"?: Option<number | string>;
  href?: Option<string>;
  ideographic?: Option<number | string>;
  "image-rendering"?: Option<number | string>;
  in2?: Option<number | string>;
  in?: Option<string>;
  intercept?: Option<number | string>;
  k1?: Option<number | string>;
  k2?: Option<number | string>;
  k3?: Option<number | string>;
  k4?: Option<number | string>;
  k?: Option<number | string>;
  kernelMatrix?: Option<number | string>;
  kernelUnitLength?: Option<number | string>;
  kerning?: Option<number | string>;
  keyPoints?: Option<number | string>;
  keySplines?: Option<number | string>;
  keyTimes?: Option<number | string>;
  lengthAdjust?: Option<number | string>;
  "letter-spacing"?: Option<number | string>;
  "lighting-color"?: Option<number | string>;
  limitingConeAngle?: Option<number | string>;
  local?: Option<number | string>;
  "marker-end"?: Option<string>;
  markerHeight?: Option<number | string>;
  "marker-mid"?: Option<string>;
  "marker-start"?: Option<string>;
  markerUnits?: Option<number | string>;
  markerWidth?: Option<number | string>;
  mask?: Option<string>;
  maskContentUnits?: Option<number | string>;
  maskUnits?: Option<number | string>;
  mathematical?: Option<number | string>;
  mode?: Option<number | string>;
  numOctaves?: Option<number | string>;
  offset?: Option<number | string>;
  opacity?: Option<number | string>;
  operator?: Option<number | string>;
  order?: Option<number | string>;
  orient?: Option<number | string>;
  orientation?: Option<number | string>;
  origin?: Option<number | string>;
  overflow?: Option<number | string>;
  "overline-position"?: Option<number | string>;
  "overline-thickness"?: Option<number | string>;
  "paint-order"?: Option<number | string>;
  "panose-1"?: Option<number | string>;
  path?: Option<string>;
  pathLength?: Option<number | string>;
  patternContentUnits?: Option<string>;
  patternTransform?: Option<number | string>;
  patternUnits?: Option<string>;
  "pointer-events"?: Option<number | string>;
  points?: Option<string>;
  pointsAtX?: Option<number | string>;
  pointsAtY?: Option<number | string>;
  pointsAtZ?: Option<number | string>;
  preserveAlpha?: Option<BoolAttr>;
  preserveAspectRatio?: Option<string>;
  primitiveUnits?: Option<number | string>;
  r?: Option<number | string>;
  radius?: Option<number | string>;
  refX?: Option<number | string>;
  refY?: Option<number | string>;
  renderingIntent?: Option<number | string>;
  repeatCount?: Option<number | string>;
  repeatDur?: Option<number | string>;
  requiredExtensions?: Option<number | string>;
  requiredFeatures?: Option<number | string>;
  restart?: Option<number | string>;
  result?: Option<string>;
  rotate?: Option<number | string>;
  rx?: Option<number | string>;
  ry?: Option<number | string>;
  scale?: Option<number | string>;
  seed?: Option<number | string>;
  "shape-rendering"?: Option<number | string>;
  slope?: Option<number | string>;
  spacing?: Option<number | string>;
  specularConstant?: Option<number | string>;
  specularExponent?: Option<number | string>;
  speed?: Option<number | string>;
  spreadMethod?: Option<string>;
  startOffset?: Option<number | string>;
  stdDeviation?: Option<number | string>;
  stemh?: Option<number | string>;
  stemv?: Option<number | string>;
  stitchTiles?: Option<number | string>;
  "stop-color"?: Option<string>;
  "stop-opacity"?: Option<number | string>;
  "strikethrough-position"?: Option<number | string>;
  "strikethrough-thickness"?: Option<number | string>;
  string?: Option<number | string>;
  stroke?: Option<string>;
  "stroke-dasharray"?: Option<string | number>;
  "stroke-dashoffset"?: Option<string | number>;
  "stroke-linecap"?: Option<"butt" | "round" | "square" | "inherit">;
  "stroke-linejoin"?: Option<"miter" | "round" | "bevel" | "inherit">;
  "stroke-miterlimit"?: Option<number | string>;
  "stroke-opacity"?: Option<number | string>;
  "stroke-width"?: Option<number | string>;
  surfaceScale?: Option<number | string>;
  systemLanguage?: Option<number | string>;
  tableValues?: Option<number | string>;
  targetX?: Option<number | string>;
  targetY?: Option<number | string>;
  "text-anchor"?: Option<string>;
  "text-decoration"?: Option<number | string>;
  "text-length"?: Option<number | string>;
  "text-rendering"?: Option<number | string>;
  to?: Option<number | string>;
  transform?: Option<string>;
  u1?: Option<number | string>;
  u2?: Option<number | string>;
  "underline-position"?: Option<number | string>;
  "underline-thickness"?: Option<number | string>;
  unicode?: Option<number | string>;
  "unicode-bidi"?: Option<number | string>;
  "unicode-range"?: Option<number | string>;
  "units-per-em"?: Option<number | string>;
  "v-alphabetic"?: Option<number | string>;
  values?: Option<string>;
  "vector-effect"?: Option<number | string>;
  version?: Option<string>;
  "vert-adv-y"?: Option<number | string>;
  "vert-origin-x"?: Option<number | string>;
  "vert-origin-y"?: Option<number | string>;
  "v-hanging"?: Option<number | string>;
  "v-ideographic"?: Option<number | string>;
  viewBox?: Option<string>;
  viewTarget?: Option<number | string>;
  visibility?: Option<number | string>;
  "v-mathematical"?: Option<number | string>;
  widths?: Option<number | string>;
  "word-spacing"?: Option<number | string>;
  "writing-mode"?: Option<number | string>;
  x1?: Option<number | string>;
  x2?: Option<number | string>;
  x?: Option<number | string>;
  xChannelSelector?: Option<string>;
  "x-height"?: Option<number | string>;
  "xlink:actuate"?: Option<string>;
  "xlink:arcrole"?: Option<string>;
  "xlink:href"?: Option<string>;
  "xlink:role"?: Option<string>;
  "xlink:show"?: Option<string>;
  "xlink:title"?: Option<string>;
  "xlink:type"?: Option<string>;
  "xml:base"?: Option<string>;
  "xml:lang"?: Option<string>;
  xmlns?: Option<string>;
  "xmlns-xlink"?: Option<string>;
  "xml-space"?: Option<string>;
  y1?: Option<number | string>;
  y2?: Option<number | string>;
  y?: Option<number | string>;
  yChannelSelector?: Option<string>;
  z?: Option<number | string>;
  zoomAndPan?: Option<string>;
}

export interface HTMLAttributes<T>
  extends AriaAttributes,
  Partial<DOMAttributes<T>> {
  $ref?: Option<T>;
  $refFn?: Option<(t: T) => void>;
  // Standard HTML Attributes
  accesskey?: Option<string>;
  autofocus?: Option<boolean>;
  class?: Option<ReactiveAttr>;
  contenteditable?: Option<BoolAttr | "inherit" | "plaintext-only">;
  contextMenu?: Option<string>;
  dir?: Option<string>;
  draggable?: Option<BoolAttr>;
  hidden?: Option<boolean>;
  id?: Option<string>;
  lang?: Option<string>;
  nonce?: Option<string>;
  slot?: Option<string>;
  spellcheck?: Option<BoolAttr>;
  style?: Option<CSSProperties>;
  tabindex?: Option<number>;
  title?: Option<string>;
  translate?: Option<"yes" | "no">;

  // Unknown
  radiogroup?: Option<string>; // <command>, <menuitem>

  // WAI-ARIA
  role?: Option<AriaRole>;

  // RDFa Attributes
  about?: Option<string>;
  content?: Option<string>;
  datatype?: Option<string>;
  // biome-ignore lint/suspicious/noExplicitAny:
  inlist?: Option<any>;
  prefix?: Option<string>;
  property?: Option<string>;
  rel?: Option<string>;
  resource?: Option<string>;
  rev?: Option<string>;
  typeof?: Option<string>;
  vocab?: Option<string>;

  // Non-standard Attributes
  autocapitalize?: Option<string>;
  autocorrect?: Option<string>;
  autosave?: Option<string>;
  color?: Option<string>;
  itemprop?: Option<string>;
  itemscope?: Option<boolean>;
  itemtype?: Option<string>;
  itemid?: Option<string>;
  itemref?: Option<string>;
  results?: Option<number>;
  security?: Option<string>;
  unselectable?: Option<"on" | "off">;

  // Living Standard
  /**
   * Hints at the type of data that might be entered by the user while editing the element or its contents
   * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
   */
  inputmode?: Option<
    "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search"
  >;
  /**
   * Specify that a standard HTML element should behave like a defined custom built-in element
   * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
   */
  is?: Option<string>;
}

export type HTMLElementAttributeMap = {
  a: Binders<AnchorHTMLAttributes<HTMLAnchorElement>>;
  abbr: Binders<HTMLAttributes<HTMLElement>>;
  address: Binders<HTMLAttributes<HTMLElement>>;
  area: Binders<AreaHTMLAttributes<HTMLAreaElement>>;
  article: Binders<HTMLAttributes<HTMLElement>>;
  aside: Binders<HTMLAttributes<HTMLElement>>;
  audio: Binders<AudioHTMLAttributes<HTMLAudioElement>>;
  b: Binders<HTMLAttributes<HTMLElement>>;
  base: Binders<BaseHTMLAttributes<HTMLBaseElement>>;
  bdi: Binders<HTMLAttributes<HTMLElement>>;
  bdo: Binders<HTMLAttributes<HTMLElement>>;
  big: Binders<HTMLAttributes<HTMLElement>>;
  blockquote: Binders<BlockquoteHTMLAttributes<HTMLQuoteElement>>;
  body: Binders<HTMLAttributes<HTMLBodyElement>>;
  br: Binders<HTMLAttributes<HTMLBRElement>>;
  button: Binders<ButtonHTMLAttributes<HTMLButtonElement>>;
  canvas: Binders<CanvasHTMLAttributes<HTMLCanvasElement>>;
  caption: Binders<HTMLAttributes<HTMLElement>>;
  center: Binders<HTMLAttributes<HTMLElement>>;
  cite: Binders<HTMLAttributes<HTMLElement>>;
  code: Binders<HTMLAttributes<HTMLElement>>;
  col: Binders<ColHTMLAttributes<HTMLTableColElement>>;
  colgroup: Binders<ColgroupHTMLAttributes<HTMLTableColElement>>;
  data: Binders<DataHTMLAttributes<HTMLDataElement>>;
  datalist: Binders<HTMLAttributes<HTMLDataListElement>>;
  dd: Binders<HTMLAttributes<HTMLElement>>;
  del: Binders<DelHTMLAttributes<HTMLModElement>>;
  details: Binders<DetailsHTMLAttributes<HTMLDetailsElement>>;
  dfn: Binders<HTMLAttributes<HTMLElement>>;
  dialog: Binders<DialogHTMLAttributes<HTMLDialogElement>>;
  div: Binders<HTMLAttributes<HTMLDivElement>>;
  dl: Binders<HTMLAttributes<HTMLDListElement>>;
  dt: Binders<HTMLAttributes<HTMLElement>>;
  em: Binders<HTMLAttributes<HTMLElement>>;
  embed: Binders<EmbedHTMLAttributes<HTMLEmbedElement>>;
  fieldset: Binders<FieldsetHTMLAttributes<HTMLFieldSetElement>>;
  figcaption: Binders<HTMLAttributes<HTMLElement>>;
  figure: Binders<HTMLAttributes<HTMLElement>>;
  footer: Binders<HTMLAttributes<HTMLElement>>;
  form: Binders<FormHTMLAttributes<HTMLFormElement>>;
  h1: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h2: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h3: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h4: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h5: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h6: Binders<HTMLAttributes<HTMLHeadingElement>>;
  head: Binders<HTMLAttributes<HTMLElement>>;
  header: Binders<HTMLAttributes<HTMLElement>>;
  hgroup: Binders<HTMLAttributes<HTMLElement>>;
  hr: Binders<HTMLAttributes<HTMLHRElement>>;
  html: Binders<HtmlHTMLAttributes<HTMLHtmlElement>>;
  i: Binders<HTMLAttributes<HTMLElement>>;
  iframe: Binders<IframeHTMLAttributes<HTMLIFrameElement>>;
  img: Binders<ImgHTMLAttributes<HTMLImageElement>>;
  input: Binders<InputHTMLAttributes<HTMLInputElement>>;
  ins: Binders<InsHTMLAttributes<HTMLModElement>>;
  kbd: Binders<HTMLAttributes<HTMLElement>>;
  keygen: Binders<KeygenHTMLAttributes<HTMLElement>>;
  label: Binders<LabelHTMLAttributes<HTMLLabelElement>>;
  legend: Binders<HTMLAttributes<HTMLLegendElement>>;
  li: Binders<LiHTMLAttributes<HTMLLIElement>>;
  link: Binders<LinkHTMLAttributes<HTMLLinkElement>>;
  main: Binders<HTMLAttributes<HTMLElement>>;
  map: Binders<MapHTMLAttributes<HTMLMapElement>>;
  mark: Binders<HTMLAttributes<HTMLElement>>;
  menu: Binders<MenuHTMLAttributes<HTMLElement>>;
  menuitem: Binders<HTMLAttributes<HTMLElement>>;
  meta: Binders<MetaHTMLAttributes<HTMLMetaElement>>;
  meter: Binders<MeterHTMLAttributes<HTMLMeterElement>>;
  nav: Binders<HTMLAttributes<HTMLElement>>;
  noscript: Binders<HTMLAttributes<HTMLElement>>;
  object: Binders<ObjectHTMLAttributes<HTMLObjectElement>>;
  ol: Binders<OlHTMLAttributes<HTMLOListElement>>;
  optgroup: Binders<OptgroupHTMLAttributes<HTMLOptGroupElement>>;
  option: Binders<OptionHTMLAttributes<HTMLOptionElement>>;
  output: Binders<OutputHTMLAttributes<HTMLOutputElement>>;
  p: Binders<HTMLAttributes<HTMLParagraphElement>>;
  picture: Binders<HTMLAttributes<HTMLElement>>;
  pre: Binders<HTMLAttributes<HTMLPreElement>>;
  progress: Binders<ProgressHTMLAttributes<HTMLProgressElement>>;
  q: Binders<QuoteHTMLAttributes<HTMLQuoteElement>>;
  rp: Binders<HTMLAttributes<HTMLElement>>;
  rt: Binders<HTMLAttributes<HTMLElement>>;
  ruby: Binders<HTMLAttributes<HTMLElement>>;
  s: Binders<HTMLAttributes<HTMLElement>>;
  samp: Binders<HTMLAttributes<HTMLElement>>;
  search: Binders<HTMLAttributes<HTMLElement>>;
  slot: Binders<SlotHTMLAttributes<HTMLSlotElement>>;
  script: Binders<ScriptHTMLAttributes<HTMLScriptElement>>;
  section: Binders<HTMLAttributes<HTMLElement>>;
  select: Binders<SelectHTMLAttributes<HTMLSelectElement>>;
  small: Binders<HTMLAttributes<HTMLElement>>;
  source: Binders<SourceHTMLAttributes<HTMLSourceElement>>;
  span: Binders<HTMLAttributes<HTMLSpanElement>>;
  strong: Binders<HTMLAttributes<HTMLElement>>;
  style: Binders<StyleHTMLAttributes<HTMLStyleElement>>;
  sub: Binders<HTMLAttributes<HTMLElement>>;
  summary: Binders<HTMLAttributes<HTMLElement>>;
  sup: Binders<HTMLAttributes<HTMLElement>>;
  table: Binders<TableHTMLAttributes<HTMLTableElement>>;
  template: Binders<HTMLAttributes<HTMLTemplateElement>>;
  tbody: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  textarea: Binders<TextareaHTMLAttributes<HTMLTextAreaElement>>;
  tfoot: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  thead: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  time: Binders<TimeHTMLAttributes<HTMLTimeElement>>;
  title: Binders<HTMLAttributes<HTMLTitleElement>>;
  tr: Binders<HTMLAttributes<HTMLTableRowElement>>;
  th: Binders<HTMLAttributes<HTMLTableCellElement>>;
  td: Binders<HTMLAttributes<HTMLTableCellElement>>;
  track: Binders<TrackHTMLAttributes<HTMLTrackElement>>;
  u: Binders<HTMLAttributes<HTMLElement>>;
  ul: Binders<HTMLAttributes<HTMLUListElement>>;
  var: Binders<HTMLAttributes<HTMLElement>>;
  video: Binders<VideoHTMLAttributes<HTMLVideoElement>>;
  wbr: Binders<HTMLAttributes<HTMLElement>>;
  svg: Binders<SVGAttributes<SVGElement>>;
  path: Binders<SVGAttributes<SVGPathElement>>;
  g: Binders<SVGAttributes<SVGGElement>>;
  circle: Binders<SVGAttributes<SVGCircleElement>>;
  rect: Binders<SVGAttributes<SVGRectElement>>;
  line: Binders<SVGAttributes<SVGLineElement>>;
  ellipse: Binders<SVGAttributes<SVGEllipseElement>>;
  polygon: Binders<SVGAttributes<SVGPolygonElement>>;
  polyline: Binders<SVGAttributes<SVGPolylineElement>>;
  text: Binders<SVGAttributes<SVGTextElement>>;
  tspan: Binders<SVGAttributes<SVGTSpanElement>>;
  textPath: Binders<SVGAttributes<SVGTextPathElement>>;
  defs: Binders<SVGAttributes<SVGDefsElement>>;
  clipPath: Binders<SVGAttributes<SVGClipPathElement>>;
  mask: Binders<SVGAttributes<SVGMaskElement>>;
  use: Binders<SVGAttributes<SVGUseElement>>;
  symbol: Binders<SVGAttributes<SVGSymbolElement>>;
  marker: Binders<SVGAttributes<SVGMarkerElement>>;
  pattern: Binders<SVGAttributes<SVGPatternElement>>;
  foreignObject: Binders<SVGAttributes<SVGForeignObjectElement>>;
  filter: Binders<SVGAttributes<SVGFilterElement>>;
  feGaussianBlur: Binders<SVGAttributes<SVGFEGaussianBlurElement>>;
  feOffset: Binders<SVGAttributes<SVGFEOffsetElement>>;
  feBlend: Binders<SVGAttributes<SVGFEBlendElement>>;
  feColorMatrix: Binders<SVGAttributes<SVGFEColorMatrixElement>>;
  feComponentTransfer: Binders<SVGAttributes<SVGFEComponentTransferElement>>;
  feComposite: Binders<SVGAttributes<SVGFECompositeElement>>;
  feConvolveMatrix: Binders<SVGAttributes<SVGFEConvolveMatrixElement>>;
  feDiffuseLighting: Binders<SVGAttributes<SVGFEDiffuseLightingElement>>;
  feDisplacementMap: Binders<SVGAttributes<SVGFEDisplacementMapElement>>;
  feDistantLight: Binders<SVGAttributes<SVGFEDistantLightElement>>;
  feFlood: Binders<SVGAttributes<SVGFEFloodElement>>;
  feFuncA: Binders<SVGAttributes<SVGFEFuncAElement>>;
  feFuncB: Binders<SVGAttributes<SVGFEFuncBElement>>;
  feFuncG: Binders<SVGAttributes<SVGFEFuncGElement>>;
  feFuncR: Binders<SVGAttributes<SVGFEFuncRElement>>;
  feMerge: Binders<SVGAttributes<SVGFEMergeElement>>;
  feMergeNode: Binders<SVGAttributes<SVGFEMergeNodeElement>>;
  feMorphology: Binders<SVGAttributes<SVGFEMorphologyElement>>;
  feSpecularLighting: Binders<SVGAttributes<SVGFESpecularLightingElement>>;
  feTile: Binders<SVGAttributes<SVGFETileElement>>;
  feTurbulence: Binders<SVGAttributes<SVGFETurbulenceElement>>;
  feDropShadow: Binders<SVGAttributes<SVGFEDropShadowElement>>;
  feImage: Binders<SVGAttributes<SVGFEImageElement>>;
  fePointLight: Binders<SVGAttributes<SVGFEPointLightElement>>;
  feSpotLight: Binders<SVGAttributes<SVGFESpotLightElement>>;
  desc: Binders<SVGAttributes<SVGDescElement>>;
  metadata: Binders<SVGAttributes<SVGMetadataElement>>;
  view: Binders<SVGAttributes<SVGViewElement>>;
  animate: Binders<SVGAttributes<SVGAnimateElement>>;
  animateTransform: Binders<SVGAttributes<SVGAnimateTransformElement>>;
  animateMotion: Binders<SVGAttributes<SVGAnimateMotionElement>>;
  set: Binders<SVGAttributes<SVGSetElement>>;
  mpath: Binders<SVGAttributes<SVGMPathElement>>;
};
