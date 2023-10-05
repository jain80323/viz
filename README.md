# **Introduction**
Bioviz is data visualization library built on top of D3. The library eases the process of creating charts mostly by editing few config files. The goal is to keep updating the library with new custom charts to visualize health care data.

# **Usage**
The library is private version which can be installed using npm. 

For installation run the following command
```javascript
npm install -D git+ssh://git@bitbucket.org:biofourmis/bioviz.git
```
Please make sure that you have ssh linked to your biofourmis bitbucket account. Steps for adding ssh to bitbucket are [here][ssh].


The module can be imported with the following command
```javascript
let bioviz = require("bioviz")
```

Individual chart components can also be imported with the following commands

```javascript
import {Compliance} from "bioviz";
```
Each visual takes **config** as the input. The below table shows the list of visuals available. All the visuals have their respective pages where the configuration is added.

| Visual | Description | Details|
| :---: | :---: | :---: |
|Compliance | Shows the compliance over the time across the categories chosen | [Details][compliance]


[ssh]: https://support.atlassian.com/bitbucket-cloud/docs/set-up-an-ssh-key/
[compliance]: https://bitbucket.org/biofourmis/bioviz/src/master/visuals/compliance/





