# drupal-intellisense

This extension will provide some intellisense capibilities to your vscode.
Currently, it only provides autocompletion for \Drupal::service and the Drupal contianer in general.

![Autocompletion](https://raw.githubusercontent.com/YahyaAhmad/drupal-intellisense/master/demo.gif)

## Installation

- Install the extenstion.
- The command **Drupal Intellisnse: Scan Workspace** will run automatically.
- If not, press Ctrl+Shift+P and type **Drupal Intellisnse: Scan Workspace**
- Try to write the service names, it should provide some suggestions now.
- Try to write ```php \Drupal::service("")```
- Additionally, writing ```php $container->get("") ``` will work too.