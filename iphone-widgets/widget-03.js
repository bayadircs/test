// Scriptable widget smoke test. Edit the number/text here to test publishing.
const widget = new ListWidget();
widget.backgroundColor = new Color("#182331");
widget.addSpacer();
const label = widget.addText("Widget 03");
label.font = Font.boldSystemFont(24);
label.textColor = Color.white();
label.centerAlignText();
widget.addSpacer();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentSmall();
}
Script.complete();
