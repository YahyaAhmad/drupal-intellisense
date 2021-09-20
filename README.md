# drupal-intellisense

This extension will provide some intellisense capibilities to your vscode.
Currently, it only provides autocompletion for \Drupal::service and the Drupal contianer in general.


## Installation

- Install the extenstion.
- The command **Drupal Intellisnse: Scan Workspace** will run automatically.
- If not, press Ctrl+Shift+P and type **Drupal Intellisnse: Scan Workspace**
- Try to write ```php \Drupal::service("")```  it should provide some suggestions now.
- Additionally, writing ```php $container->get("") ``` will work too.