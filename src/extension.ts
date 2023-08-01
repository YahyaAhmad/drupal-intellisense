/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from "vscode";
import * as yaml from "js-yaml";
import * as fs from "fs";
import { ServicesFile } from "./interface";
export function activate(context: vscode.ExtensionContext) {
  // const provider1 = vscode.languages.registerCompletionItemProvider('plaintext', {

  // 	provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {

  // 		// a simple completion item which inserts `Hello World!`
  // 		const simpleCompletion = new vscode.CompletionItem('Hello World!');

  // 		// a completion item that inserts its text as snippet,
  // 		// the `insertText`-property is a `SnippetString` which will be
  // 		// honored by the editor.
  // 		const snippetCompletion = new vscode.CompletionItem('Good part of the day');
  // 		snippetCompletion.insertText = new vscode.SnippetString('Good ${1|morning,afternoon,evening|}. It is ${1}, right?');
  // 		snippetCompletion.documentation = new vscode.MarkdownString("Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.");

  // 		// a completion item that can be accepted by a commit character,
  // 		// the `commitCharacters`-property is set which means that the completion will
  // 		// be inserted and then the character will be typed.
  // 		const commitCharacterCompletion = new vscode.CompletionItem('console');
  // 		commitCharacterCompletion.commitCharacters = ['.'];
  // 		commitCharacterCompletion.documentation = new vscode.MarkdownString('Press `.` to get `console.`');

  // 		// a completion item that retriggers IntelliSense when being accepted,
  // 		// the `command`-property is set which the editor will execute after
  // 		// completion has been inserted. Also, the `insertText` is set so that
  // 		// a space is inserted after `new`
  // 		const commandCompletion = new vscode.CompletionItem('new');
  // 		commandCompletion.kind = vscode.CompletionItemKind.Keyword;
  // 		commandCompletion.insertText = 'new ';
  // 		commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };

  // 		// return all completion items as array
  // 		return [
  // 			simpleCompletion,
  // 			snippetCompletion,
  // 			commitCharacterCompletion,
  // 			commandCompletion
  // 		];
  // 	}
  // });
  // Register snippet completion provider

  vscode.commands.registerCommand("drupal.intellisense.scan", () => {
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Drupal Intellisense Scanning",
        cancellable: true,
      },
      (progress, token) => {
        token.onCancellationRequested(() => {
          console.log("User canceled the long running operation");
        });
        progress.report({
          increment: 0,
          message: "Scanning for services.yml...",
        });

        const promise = new Promise<void>((resolve) => {
          // Services
          vscode.workspace
            .findFiles("**/*.services.yml", "{**/node_modules,**/vendor}")
            .then((f) => {
              progress.report({ increment: 50, message: "Parsing..." });

              const services: vscode.CompletionItem[] = [];
              const servicesWithClasses: vscode.CompletionItem[] = [];
              const cacheContexts: vscode.CompletionItem[] = [];
              f.forEach((uri) => {
                const doc: ServicesFile = yaml.load(
                  fs.readFileSync(uri.path, "utf-8")
                ) as ServicesFile;
                if (doc.services) {
                  Object.keys(doc.services).forEach((serviceId) => {
                    let hasCacheContext = false;
                    // If it is a cache context, save it in another variable.
                    const className = doc.services[serviceId]?.class;

                    if (!className) {
                      return;
                    }

                    if (doc.services[serviceId]?.tags) {
                      hasCacheContext = !!doc.services[serviceId].tags.find(
                        (tag) => {
                          return tag.name && tag.name == "cache.context";
                        }
                      );
                    }

                    if (hasCacheContext) {
                      cacheContexts.push(
                        new vscode.CompletionItem(
                          serviceId,
                          vscode.CompletionItemKind.Keyword
                        )
                      );
                    } else {
                      services.push(
                        new vscode.CompletionItem(
                          serviceId,
                          vscode.CompletionItemKind.Keyword
                        )
                      );

                      const fullServiceCompletion = new vscode.CompletionItem(
                        {
                          label: serviceId,
                          detail: " " + className,
                        },
                        vscode.CompletionItemKind.Snippet
                      );

                      fullServiceCompletion.filterText =
                        '\\Drupal::service("' +
                        serviceId +
                        " \\Drupal::service('" +
                        serviceId;
                      // Replace dots with underscores.
                      const variableName = serviceId.replace(/\./g, "_");

                      fullServiceCompletion.insertText =
                        new vscode.SnippetString(
                          `/** @var \\${className} $\${1:${variableName}} */\n$\${1:${variableName}} = \\Drupal::service("${serviceId}");\n`
                        );
                      servicesWithClasses.push(fullServiceCompletion);
                    }
                  });
                }
              });
              context.workspaceState.update(
                "drupal.intellisense.services",
                services
              );
              context.workspaceState.update(
                "drupal.intellisense.servicesWithDefinitions",
                servicesWithClasses
              );
              progress.report({ increment: 50 });
              resolve();
            });
        });

        return promise;
      }
    );
  });

  // Execute scanning on activation
  vscode.commands.executeCommand("drupal.intellisense.scan");

  const servicesProvider = vscode.languages.registerCompletionItemProvider(
    "php",
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        const servicesEndsWith = ['$container->get("', "$container->get('"];

        // TODO: Cache contexts snippets.

        // get all text until the `position` and check if it reads `console.`
        // and if so then complete if `log`, `warn`, and `error`
        const linePrefix = document
          .lineAt(position)
          .text.substr(0, position.character);
        const autoCompleteService = servicesEndsWith.some((str) => {
          if (linePrefix.endsWith(str)) {
            return true;
          }
        });

        if (autoCompleteService) {
          return context.workspaceState.get("drupal.intellisense.services");
        }
      },
    },
    '"',
    "'"
  );

  const servicesWithDefinition =
    vscode.languages.registerCompletionItemProvider(
      "php",
      {
        provideCompletionItems(
          document: vscode.TextDocument,
          position: vscode.Position
        ) {
          const servicesEndsWith = ['::service("', "::service('"];

          const linePrefix = document
            .lineAt(position)
            .text.substr(0, position.character);
          const linePrefixBefore = document
            .lineAt(position)
            .text.substr(0, position.character - 1);
          const autoCompleteService = servicesEndsWith.some((str) => {
            // If it ends with str or the line is whitespace.
            if (
              linePrefix.endsWith(str) ||
              linePrefixBefore == "" ||
              !/\S/.test(linePrefixBefore)
            ) {
              return true;
            }
          });

          if (autoCompleteService) {
            const items = context.workspaceState.get(
              "drupal.intellisense.servicesWithDefinitions"
            ) as vscode.CompletionItem[];

            // Repalce the current line with the new snippet.
            const currentLine = document.lineAt(position.line);
            const range = new vscode.Range(
              new vscode.Position(
                position.line,
                currentLine.firstNonWhitespaceCharacterIndex
              ),
              new vscode.Position(position.line, currentLine.text.length)
            );

            items.forEach((item) => {
              item.range = range;
            });

            return items;
          }
        },
      },
      '"',
      "'"
    );

  context.subscriptions.push(servicesProvider);
  context.subscriptions.push(servicesWithDefinition);
}
