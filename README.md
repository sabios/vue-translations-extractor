# vue-translations-extractor

[NPM](https://www.npmjs.com/package/vue-translations-extractor)

## Introduction
Project goal is to get words into the attributes and functions of vue files to send to a template pot file

## Installation
```
npm install @sabios/vue-translations-extractor
```

## Usage
```
$ node ./node_modules/@sabios/vue-translations-extractor -o TEMPLATE.pot -s SOURCE -s ANOTHER_SOURCE
```
* TEMPLATE.pot: location of template.pot file
* SOURCE/ANOTHER_SOURCE: src of vue files

## Examples of code that will be extracted from vue files
HTML
```
<div v-translate="'key1'"></div>
<input :placeholder="$t('key2')">
<div>{{$t('key3')}}</div>
```
JS
```
{
    data() {
        foo: this.$t('key')
    }
}
```

## All credits go to
* [lukasgeiter](https://github.com/lukasgeiter) for create a great library [gettext-extractor](https://github.com/lukasgeiter/gettext-extractor)
* [paumoreno](https://github.com/paumoreno) for the [gist](https://gist.github.com/paumoreno/cdfa14942424e895168a269a2deef1f3)
* [mathvaleriano](https://github.com/mathvaleriano) for update code enable another parsers and more