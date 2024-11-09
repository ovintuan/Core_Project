'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var buffer = require('buffer');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var vscode__namespace = /*#__PURE__*/_interopNamespace(vscode);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var path__namespace = /*#__PURE__*/_interopNamespace(path);

const STATE_INFO = 'stateInfo';
const FAVORITES = 'favorites';
const FAVORITE_GROUPS = 'favoriteGroups';
const MENU_HISTORY = 'history';
const COMPARISONS_HISTORY = 'comparisons';
function getStateInfo(context) {
    return context.globalState.get(STATE_INFO, { lastModified: 0 });
}
function getFavorites(context) {
    return context.globalState.get(FAVORITES, []);
}
function updateFavorites(context, favorites) {
    context.globalState.update(FAVORITES, favorites);
    updateStateInfo(context);
}
function getFavoriteGroups(context) {
    return context.globalState.get(FAVORITE_GROUPS, []);
}
function updateFavoriteGroups(context, favoriteGroups) {
    context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
    updateStateInfo(context);
}
function getHistory(context) {
    return context.globalState.get(MENU_HISTORY, []);
}
function updateHistory(context, history) {
    context.globalState.update(MENU_HISTORY, history);
    updateStateInfo(context);
}
function getComparisons(context) {
    return context.globalState.get(COMPARISONS_HISTORY, []);
}
function updateComparisons(context, comparisons) {
    context.globalState.update(COMPARISONS_HISTORY, comparisons);
    updateStateInfo(context);
}
function updateCollapseState(context, favoriteGroups) {
    context.globalState.update(FAVORITE_GROUPS, favoriteGroups);
}
function updateStateInfo(context) {
    context.globalState.update(STATE_INFO, {
        lastModified: +new Date(),
    });
}

let isMacOs = false;
let isWindows = false;
if (process.platform === 'darwin')
    isMacOs = true;
else if (process.platform === 'win32')
    isWindows = true;
else
    ;

const findRegExpChars$1 = /\\[*?]|\*\*\/|\/\*\*|[\/\\\[\]\.\*\^\$\|\+\-\{\}\(\)\?\!\=\:\,]/g;
const findIllegalAndControlChars = /[\x00-\x1f"\*<>\?\|\x80-\x9f]/g;
const findColon = /:/g;
function createDirectory(pathname) {
    fs__namespace.mkdirSync(pathname, { recursive: true });
}
function copyFile(sourcePath, destPath) {
    destPath = path__namespace.resolve(sourcePath, destPath);
    const dirname = path__namespace.dirname(destPath);
    if (!fs__namespace.existsSync(dirname))
        createDirectory(dirname);
    return new Promise((resolve, reject) => {
        const source = fs__namespace.createReadStream(sourcePath);
        const dest = fs__namespace.createWriteStream(destPath);
        source.pipe(dest);
        source.on('error', (error) => reject(error));
        source.on('end', () => resolve(undefined));
    });
}
function copySymbolicLink(sourcePath, destPath) {
    destPath = path__namespace.resolve(sourcePath, destPath);
    const dirname = path__namespace.dirname(destPath);
    if (!fs__namespace.existsSync(dirname))
        createDirectory(dirname);
    return new Promise((resolve, reject) => {
        fs__namespace.symlink(fs__namespace.readlinkSync(sourcePath), destPath, (error) => {
            if (error)
                reject(error);
            else
                resolve(undefined);
        });
    });
}
function walkTree(cwd, options) {
    return new Promise((resolve, reject) => {
        var _a;
        const job = {
            error: null,
            ignore: Array.isArray(options.excludes) ? createFindGlob$1(options.excludes, options.useCaseSensitive) : null,
            result: {},
            tasks: 1,
            maxSize: options.maxFileSize || 0,
            abort: (_a = options.abortOnError) !== null && _a !== void 0 ? _a : true,
            done: (error) => {
                if (error) {
                    job.error = error;
                    reject(error);
                }
                else
                    resolve(job.result);
            },
        };
        _walktree(job, cwd);
    });
}
function walkUp(dirname, filename) {
    return dirname.split(path__namespace.sep).some(() => {
        if (fs__namespace.existsSync(path__namespace.join(dirname, filename)))
            return true;
        dirname = path__namespace.dirname(dirname);
        return false;
    }) ? path__namespace.join(dirname, filename) : null;
}
function lstatSync(pathname) {
    try {
        return fs__namespace.lstatSync(pathname);
    }
    catch (error) {
        return null;
    }
}
function lstat(pathname) {
    return new Promise((resolve) => {
        fs__namespace.lstat(pathname, (error, stat) => resolve(stat || null));
    });
}
function createFindGlob$1(ignore, useCaseSensitive) {
    return new RegExp(`^(${ignore.map((pattern) => escapeGlobForRegExp(pattern)).join('|')})$`, useCaseSensitive ? '' : 'i');
}
function sanitize(pathname) {
    let name = `${pathname}`.replace(findIllegalAndControlChars, '');
    if (!isWindows)
        name = name.replace(findColon, '');
    return name;
}
function escapeGlobForRegExp(text) {
    return `${text}`.replace(findRegExpChars$1, (match) => {
        if (match === '\\*' || match === '\\?')
            return match;
        if (match === '/')
            return '[/\\\\]';
        if (match === '*')
            return '[^/\\\\]*';
        if (match === '?')
            return '.';
        if (match === '**/')
            return '(?:[^/\\\\]+[/\\\\])*';
        if (match === '/**')
            return '(?:[/\\\\][^/\\\\]+)*';
        return `\\${match}`;
    });
}
function addFile$1(result, type, stat, fsPath, root, relative, dirname, ignore) {
    const sep = type === 'folder' ? path__namespace.sep : '';
    result[fsPath] = {
        root,
        relative,
        fsPath,
        stat,
        path: fsPath + sep,
        name: relative + sep,
        basename: path__namespace.basename(relative) + sep,
        dirname,
        extname: type === 'file' ? path__namespace.extname(relative) : '',
        type,
        ignore,
    };
}
function _walktree(job, cwd, relative = '') {
    if (job.abort && job.error)
        return;
    const dirname = path__namespace.join(cwd, relative);
    fs__namespace.readdir(dirname, (dirError, names) => {
        if (job.abort) {
            if (job.error)
                return;
            if (dirError)
                return job.done(dirError);
        }
        job.tasks--;
        if (dirError)
            return !job.tasks ? job.done() : undefined;
        job.tasks += names.length;
        if (!job.tasks)
            return job.done();
        names.forEach((name) => {
            const pathname = path__namespace.join(dirname, name);
            fs__namespace.lstat(pathname, (statError, stat) => {
                var _a;
                if (job.abort) {
                    if (job.error)
                        return;
                    if (statError)
                        return job.done(statError);
                }
                const currentRelative = path__namespace.join(relative, name);
                let currentDirname = path__namespace.dirname(currentRelative);
                let ignore = (_a = job.ignore) === null || _a === void 0 ? void 0 : _a.test(currentRelative);
                currentDirname = currentDirname === '.' ? '' : currentDirname + path__namespace.sep;
                if (statError) {
                    addFile$1(job.result, 'error', null, pathname, cwd, currentRelative, currentDirname, true);
                }
                else if (stat.isDirectory()) {
                    addFile$1(job.result, 'folder', stat, pathname, cwd, currentRelative, currentDirname, ignore);
                    if (!ignore)
                        return _walktree(job, cwd, currentRelative);
                }
                else if (stat.isFile()) {
                    const maxSize = job.maxSize;
                    if (maxSize && stat.size > maxSize)
                        ignore = true;
                    addFile$1(job.result, 'file', stat, pathname, cwd, currentRelative, currentDirname, ignore);
                }
                else if (stat.isSymbolicLink()) {
                    addFile$1(job.result, 'symlink', stat, pathname, cwd, currentRelative, currentDirname, ignore);
                }
                else {
                    addFile$1(job.result, 'unknown', stat, pathname, cwd, currentRelative, currentDirname, true);
                }
                job.tasks--;
                if (!job.tasks)
                    job.done();
            });
        });
    });
}

const _parse = JSON.parse;
const findComments = /"(?:[^"\r\n\\]*(?:\\.)*)*"|(\/\*(?:.|[\r\n])*?\*\/|\/\/[^\r\n]*)/g;
const findTrailingCommas = /"(?:[^"\r\n\\]*(?:\\.)*)*"|,\s*?([\]}])/g;
function parse(jsonc, reviver) {
    const json = jsonc
        .replace(findComments, (match, comment) => comment ? '' : match)
        .replace(findTrailingCommas, (match, close) => close || match);
    return _parse(json, reviver);
}

const hasCaseSensitiveFileSystem = !fs__namespace.existsSync(path__namespace.join(__dirname, path__namespace.basename(__filename).toUpperCase()));
const MB = 1048576;
const MAX_FILE_SIZE$1 = Number.MAX_SAFE_INTEGER / MB;
function get(key, value) {
    return vscode__namespace.workspace.getConfiguration('l13Diff').get(key, value);
}
function update(key, value, global = true) {
    return vscode__namespace.workspace.getConfiguration('l13Diff').update(key, value, global);
}
function maxHistoryEntries() {
    return get('maxHistoryEntries', 10);
}
function maxRecentlyUsed() {
    return get('maxRecentlyUsed', 10);
}
function getExcludes(pathA, pathB) {
    let ignore = get('ignore');
    if (ignore)
        ignore = showDepricated(ignore, 'Settings');
    const excludes = get('exclude', []) || ignore;
    const excludesA = useWorkspaceSettings(pathA) ? excludes : loadSettingsExclude(pathA) || excludes;
    const excludesB = useWorkspaceSettings(pathB) ? excludes : loadSettingsExclude(pathB) || excludes;
    return [...excludesA, ...excludesB].filter((value, index, values) => values.indexOf(value) === index);
}
function ignoreTrimWhitespace() {
    const useDefault = get('ignoreTrimWhitespace', 'default');
    return useDefault === 'default' ? vscode__namespace.workspace.getConfiguration('diffEditor').get('ignoreTrimWhitespace', true) : useDefault === 'on';
}
function enableTrash() {
    const enableTrashValue = get('enableTrash', 'default');
    return enableTrashValue === 'default' ? vscode__namespace.workspace.getConfiguration('files').get('enableTrash', true) : enableTrashValue === 'on';
}
function maxFileSize() {
    const maxFileSizeValue = parseInt(`${get('maxFileSize', 0)}`, 10);
    return maxFileSizeValue > 0 && maxFileSizeValue < MAX_FILE_SIZE$1 ? maxFileSizeValue * MB : 0;
}
function openInNewPanel() {
    return get('openInNewDiffPanel', false);
}
function loadSettingsExclude(pathname) {
    const codePath = walkUp(pathname, '.vscode');
    if (!codePath)
        return null;
    const codeSettingsPath = path__namespace.join(codePath, 'settings.json');
    const stat = lstatSync(codeSettingsPath);
    let json = {};
    if (stat && stat.isFile()) {
        const content = fs__namespace.readFileSync(codeSettingsPath, { encoding: 'utf-8' });
        try {
            json = parse(content);
        }
        catch (_a) {
            vscode__namespace.window.showErrorMessage(`Syntax error in settings file "${codeSettingsPath}"!`);
        }
    }
    let ignore = json['l13Diff.ignore'];
    if (ignore)
        ignore = showDepricated(ignore, pathname);
    return json['l13Diff.exclude'] || ignore || null;
}
function useWorkspaceSettings(pathname) {
    return vscode__namespace.workspace.workspaceFile && vscode__namespace.workspace.workspaceFolders.some((folder) => pathname.startsWith(folder.uri.fsPath));
}
function showDepricated(ignore, pathname) {
    const filename = pathname ? `${pathname}: ` : '';
    const message = `${filename}"l13Diff.ignore" is depricated. Please use "l13Diff.exclude" which supports more glob patterns like path segments.`;
    vscode__namespace.window.showWarningMessage(message);
    return ignore.map((pattern) => `**/${pattern}`);
}

class FavoriteGroupTreeItem extends vscode.TreeItem {
    constructor(favoriteGroup) {
        super(favoriteGroup.label, favoriteGroup.collapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded);
        this.favoriteGroup = favoriteGroup;
        this.contextValue = 'favoriteGroup';
        this.id = `${favoriteGroup.id}`;
    }
}

const basePath$1 = path.resolve(__dirname, '..', 'images', 'favorites');
const iconPath = {
    light: path.join(basePath$1, 'favorite-item-light.svg'),
    dark: path.join(basePath$1, 'favorite-item-dark.svg'),
};
class FavoriteTreeItem extends vscode__namespace.TreeItem {
    constructor(favorite) {
        super(favorite.label);
        this.favorite = favorite;
        this.command = {
            arguments: [this],
            command: 'l13Diff.action.favorite.compare',
            title: 'Compare',
        };
        this.iconPath = iconPath;
        this.contextValue = 'favorite';
        if (favorite.groupId !== undefined)
            this.contextValue = `sub${this.contextValue}`;
        this.tooltip = `${this.favorite.fileA} ↔ ${this.favorite.fileB}`;
    }
}

class FavoritesProvider {
    static create(states) {
        return FavoritesProvider.current || (FavoritesProvider.current = new FavoritesProvider(states));
    }
    constructor(states) {
        this._onDidChangeTreeData = new vscode__namespace.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.favorites = [];
        this.favoriteGroups = [];
        this.favorites = states.favorites;
        this.favoriteGroups = states.favoriteGroups;
        const initialState = get('initialFavoriteGroupsState', 'remember');
        if (initialState !== 'remember') {
            this.favoriteGroups.forEach((favoriteGroup) => favoriteGroup.collapsed = initialState === 'collapsed');
        }
    }
    dispose() {
        FavoritesProvider.current = null;
    }
    refresh(states) {
        if (states === null || states === void 0 ? void 0 : states.favorites)
            this.favorites = states.favorites;
        if (states === null || states === void 0 ? void 0 : states.favoriteGroups)
            this.favoriteGroups = states.favoriteGroups;
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        const list = [];
        if (!this.favorites.length && !this.favoriteGroups.length)
            return Promise.resolve(list);
        if (element) {
            const groupId = element.favoriteGroup.id;
            this.favorites.filter((favorite) => favorite.groupId === groupId).forEach((favorite) => list.push(new FavoriteTreeItem(favorite)));
        }
        else {
            this.favoriteGroups.forEach((favoriteGroup) => list.push(new FavoriteGroupTreeItem(favoriteGroup)));
            this.favorites.filter((favorite) => favorite.groupId === undefined).forEach((favorite) => list.push(new FavoriteTreeItem(favorite)));
        }
        return Promise.resolve(list);
    }
}
FavoritesProvider.current = null;

const basePath = path.resolve(__dirname, '..', 'images', 'history');
class HistoryTreeItem extends vscode__namespace.TreeItem {
    constructor(comparison) {
        super(comparison.label);
        this.comparison = comparison;
        this.command = {
            arguments: [this],
            command: 'l13Diff.action.history.compare',
            title: 'Compare',
        };
        this.contextValue = 'history';
        let type = 'item';
        if (comparison.type) {
            type = comparison.type;
            this.contextValue += `-${type}`;
        }
        this.iconPath = {
            light: path.join(basePath, `history-${type}-light.svg`),
            dark: path.join(basePath, `history-${type}-dark.svg`),
        };
        this.description = `${this.comparison.desc || ''}`;
        this.tooltip = `${this.comparison.fileA} ↔ ${this.comparison.fileB}`;
    }
}

class HistoryProvider {
    static create(states) {
        return HistoryProvider.current || (HistoryProvider.current = new HistoryProvider(states));
    }
    constructor(states) {
        this._onDidChangeTreeData = new vscode__namespace.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.comparisons = [];
        this.comparisons = states.comparisons;
    }
    dispose() {
        HistoryProvider.current = null;
    }
    refresh(states) {
        if (states === null || states === void 0 ? void 0 : states.comparisons)
            this.comparisons = states.comparisons;
        this._onDidChangeTreeData.fire(undefined);
    }
    getTreeItem(element) {
        return element;
    }
    getChildren() {
        const list = [];
        this.comparisons.forEach((comparison) => list.push(new HistoryTreeItem(comparison)));
        return Promise.resolve(list);
    }
}

function remove(values, value) {
    const index = values.indexOf(value);
    if (index !== -1)
        values.splice(index, 1);
}
function sortCaseInsensitive(a, b) {
    a = a.toUpperCase();
    b = b.toUpperCase();
    return a < b ? -1 : a > b ? 1 : 0;
}

class FavoriteGroupsState {
    static create(context) {
        return FavoriteGroupsState.current || (FavoriteGroupsState.current = new FavoriteGroupsState(context));
    }
    constructor(context) {
        this.context = context;
        this._onDidChangeFavoriteGroups = new vscode__namespace.EventEmitter();
        this.onDidChangeFavoriteGroups = this._onDidChangeFavoriteGroups.event;
    }
    get() {
        return getFavoriteGroups(this.context);
    }
    save(favoriteGroups) {
        updateFavoriteGroups(this.context, favoriteGroups);
    }
    getByName(label) {
        return this.get().find((favoriteGroup) => favoriteGroup.label === label) || null;
    }
    add(label) {
        const favoriteGroups = this.get();
        if (favoriteGroups.some((favoriteGroup) => favoriteGroup.label === label))
            return;
        favoriteGroups.push({ label, id: getNextGroupId(favoriteGroups), collapsed: false });
        favoriteGroups.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
        this.save(favoriteGroups);
        this._onDidChangeFavoriteGroups.fire(favoriteGroups);
    }
    rename(favoriteGroup, label) {
        const favoriteGroups = getFavoriteGroups(this.context);
        const groupId = favoriteGroup.id;
        for (const group of favoriteGroups) {
            if (group.id === groupId) {
                group.label = label;
                favoriteGroups.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
                this.save(favoriteGroups);
                this._onDidChangeFavoriteGroups.fire(favoriteGroups);
                break;
            }
        }
    }
    import(label) {
        let group = this.getByName(label);
        if (!group) {
            const favoriteGroups = this.get();
            group = { label, id: getNextGroupId(favoriteGroups), collapsed: false };
            favoriteGroups.push({ label, id: getNextGroupId(favoriteGroups), collapsed: false });
            favoriteGroups.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
            this.save(favoriteGroups);
        }
        return group;
    }
    remove(favoriteGroup, removeItems) {
        const favoriteGroups = getFavoriteGroups(this.context);
        const groupId = favoriteGroup.id;
        for (let i = 0; i < favoriteGroups.length; i++) {
            if (favoriteGroups[i].id === groupId) {
                favoriteGroups.splice(i, 1);
                this.save(favoriteGroups);
                let favorites = getFavorites(this.context);
                if (removeItems) {
                    favorites = favorites.filter((favorite) => favorite.groupId !== groupId);
                }
                else {
                    for (const favorite of favorites) {
                        if (favorite.groupId === groupId)
                            delete favorite.groupId;
                    }
                }
                updateFavorites(this.context, favorites);
                this._onDidChangeFavoriteGroups.fire(favoriteGroups);
                break;
            }
        }
    }
    saveCollapseState(favoriteGroup, collapsed) {
        const favoriteGroups = getFavoriteGroups(this.context);
        const groupId = favoriteGroup.id;
        favoriteGroups.some((group) => group.id === groupId ? (group.collapsed = collapsed) || true : false);
        updateCollapseState(this.context, favoriteGroups);
    }
}
FavoriteGroupsState.current = null;
function getNextGroupId(favoriteGroups) {
    if (!favoriteGroups.length)
        return 0;
    const groupIds = favoriteGroups.map((favoriteGroup) => favoriteGroup.id);
    const maxGroupId = Math.max.apply(null, groupIds);
    let i = 0;
    while (i <= maxGroupId) {
        if (!groupIds.includes(i))
            return i;
        i++;
    }
    return i;
}

class FavoritesState {
    static create(context) {
        return FavoritesState.current || (FavoritesState.current = new FavoritesState(context));
    }
    constructor(context) {
        this.context = context;
        this._onDidChangeFavorites = new vscode__namespace.EventEmitter();
        this.onDidChangeFavorites = this._onDidChangeFavorites.event;
    }
    get() {
        return getFavorites(this.context);
    }
    getByName(label) {
        const favorites = this.get();
        for (const favorite of favorites) {
            if (favorite.label === label)
                return favorite;
        }
        return null;
    }
    save(favorites) {
        updateFavorites(this.context, favorites);
    }
    add(label, fileA, fileB, groupId) {
        if (this.getByName(label))
            return;
        const favorites = this.get();
        favorites.push({ label, fileA, fileB, groupId });
        favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
        this.save(favorites);
        this._onDidChangeFavorites.fire(favorites);
    }
    rename(favorite, label) {
        if (this.getByName(label))
            return;
        const favorites = this.get();
        for (const fav of favorites) {
            if (fav.label === favorite.label) {
                fav.label = label;
                favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
                this.save(favorites);
                this._onDidChangeFavorites.fire(favorites);
                break;
            }
        }
    }
    addFavoriteToGroup(favorite, groupId) {
        const favorites = this.get();
        for (const fav of favorites) {
            if (fav.label === favorite.label) {
                fav.groupId = groupId;
                break;
            }
        }
        this.save(favorites);
        this._onDidChangeFavorites.fire(favorites);
    }
    getFavoritesByGroup(favoriteGroup) {
        const groupId = favoriteGroup.id;
        return this.get().filter((favorite) => favorite.groupId === groupId);
    }
    removeFavoriteFromGroup(favorite) {
        const favorites = this.get();
        for (const fav of favorites) {
            if (fav.label === favorite.label) {
                delete fav.groupId;
                break;
            }
        }
        this.save(favorites);
        this._onDidChangeFavorites.fire(favorites);
    }
    remove(favorite) {
        const favorites = this.get();
        for (let i = 0; i < favorites.length; i++) {
            if (favorites[i].label === favorite.label) {
                favorites.splice(i, 1);
                this.save(favorites);
                this._onDidChangeFavorites.fire(favorites);
                break;
            }
        }
    }
    import(items) {
        const favorites = this.get();
        const labels = Object.create(null);
        for (const favorite of favorites)
            labels[favorite.label] = true;
        for (const item of items) {
            let label = item.label;
            if (labels[label]) {
                let count = 1;
                do {
                    label = `${item.label} (${count++})`;
                } while (labels[label]);
                labels[label] = true;
            }
            favorites.push({
                label,
                fileA: item.pathA,
                fileB: item.pathB,
                groupId: item.groupId,
            });
        }
        favorites.sort(({ label: a }, { label: b }) => sortCaseInsensitive(a, b));
        this.save(favorites);
        this._onDidChangeFavorites.fire(favorites);
    }
    clear() {
        this.save([]);
        updateFavoriteGroups(this.context, []);
        this._onDidChangeFavorites.fire([]);
    }
}
FavoritesState.current = null;

function formatNameAndDesc(pathA, pathB) {
    const namesA = path.normalize(pathA).split(path.sep);
    const namesB = path.normalize(pathB).split(path.sep);
    const desc = [];
    if (!namesA[namesA.length - 1])
        namesA.pop();
    if (!namesB[namesB.length - 1])
        namesB.pop();
    while (namesA.length > 1 && namesB.length > 1 && namesA[0] === namesB[0]) {
        desc.push(namesA.shift());
        namesB.shift();
    }
    if (desc.length && desc.join('') === '') {
        desc.forEach((value, index) => {
            namesA.splice(index, 0, value);
            namesB.splice(index, 0, value);
        });
        desc.splice(0, desc.length);
    }
    if (pathA === path.sep)
        namesA.push('');
    if (pathB === path.sep)
        namesB.push('');
    return [`${namesA.join(path.sep)} ↔ ${namesB.join(path.sep)}`, desc.join(path.sep)];
}
function formatName(pathA, pathB) {
    return `${path.basename(pathA)} ↔ ${path.basename(pathB)}`;
}
function formatError(error) {
    return `${error.message}\n${error.stack}`;
}

class HistoryState {
    static create(context) {
        return HistoryState.current || (HistoryState.current = new HistoryState(context));
    }
    constructor(context) {
        this.context = context;
        this._onDidChangeComparisons = new vscode__namespace.EventEmitter();
        this.onDidChangeComparisons = this._onDidChangeComparisons.event;
    }
    get() {
        return getComparisons(this.context);
    }
    save(comparions) {
        updateComparisons(this.context, comparions);
    }
    add(pathA, pathB, type) {
        let comparisons = getComparisons(this.context);
        const [label, desc] = formatNameAndDesc(pathA, pathB);
        const comparison = {
            fileA: pathA,
            fileB: pathB,
            label,
            desc,
            type,
        };
        removeComparison(comparisons, comparison);
        comparisons.unshift(comparison);
        comparisons = comparisons.slice(0, maxHistoryEntries());
        this.save(comparisons);
        this._onDidChangeComparisons.fire(comparisons);
    }
    remove(comparison) {
        const comparisons = getComparisons(this.context);
        if (removeComparison(comparisons, comparison)) {
            this.save(comparisons);
            this._onDidChangeComparisons.fire(comparisons);
        }
    }
    clear() {
        this.save([]);
        this._onDidChangeComparisons.fire([]);
    }
}
HistoryState.current = null;
function removeComparison(comparisons, comparison) {
    for (let i = 0; i < comparisons.length; i++) {
        const com = comparisons[i];
        if (com.fileA === comparison.fileA && com.fileB === comparison.fileB) {
            comparisons.splice(i, 1);
            return true;
        }
    }
    return false;
}

function activate$b(context) {
    const favoritesState = FavoritesState.create(context);
    const favoriteGroupsState = FavoriteGroupsState.create(context);
    const historyState = HistoryState.create(context);
    let previousLastModified = getStateInfo(context).lastModified;
    context.subscriptions.push(vscode__namespace.window.onDidChangeWindowState(({ focused }) => {
        var _a, _b;
        if (focused) {
            const currentLastModified = getStateInfo(context).lastModified;
            if (previousLastModified !== currentLastModified) {
                previousLastModified = currentLastModified;
                (_a = FavoritesProvider.current) === null || _a === void 0 ? void 0 : _a.refresh({
                    favorites: favoritesState.get(),
                    favoriteGroups: favoriteGroupsState.get(),
                });
                (_b = HistoryProvider.current) === null || _b === void 0 ? void 0 : _b.refresh({
                    comparisons: historyState.get(),
                });
            }
        }
    }));
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function register(context, commands) {
    for (const [command, callback] of Object.entries(commands)) {
        context.subscriptions.push(vscode__namespace.commands.registerCommand(command, callback));
    }
}

function openFile$1(options = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield vscode__namespace.window.showOpenDialog(Object.assign({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false }, options));
        return uris ? uris[0].fsPath : null;
    });
}
function openFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        const uris = yield vscode__namespace.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
        });
        return uris ? uris[0].fsPath : null;
    });
}
function confirm(text, ...buttons) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode__namespace.window.showInformationMessage(text, { modal: true }, ...buttons);
    });
}

function reveal(pathname) {
    if (lstatSync(pathname)) {
        vscode__namespace.commands.executeCommand('revealFileInOS', vscode__namespace.Uri.file(pathname));
    }
    else
        vscode__namespace.window.showErrorMessage(`Path "${pathname}" doesn't exist!`);
}

const findBackupFileName = /\d{4}(\-\d{2}){5}(?:\-auto)?.json/;
function activate$a(context) {
    const dirname = path__namespace.join(context.globalStorageUri.fsPath, 'backups');
    register(context, {
        'l13Diff.action.developer.backup': () => {
            createBackup(context, dirname, `${formatDate(new Date())}.json`);
        },
        'l13Diff.action.developer.reveal': () => {
            if (fs__namespace.existsSync(dirname))
                reveal(dirname);
            else
                vscode__namespace.window.showInformationMessage('No backups available');
        },
        'l13Diff.action.developer.remove': () => __awaiter(this, void 0, void 0, function* () {
            const item = yield selectBackup(dirname);
            if (item)
                fs__namespace.unlinkSync(path__namespace.join(dirname, item.label));
        }),
        'l13Diff.action.developer.restore': () => __awaiter(this, void 0, void 0, function* () {
            const item = yield selectBackup(dirname);
            if (item) {
                const content = JSON.parse(fs__namespace.readFileSync(path__namespace.join(dirname, item.label), 'utf-8'));
                updateComparisons(context, content.comparisons);
                updateFavorites(context, content.favorites);
                updateFavoriteGroups(context, content.favoriteGroups);
                updateHistory(context, content.history);
                showMessageReload(`Restored backup "${item.label}"`);
            }
        }),
        'l13Diff.action.developer.clear': () => __awaiter(this, void 0, void 0, function* () {
            if (!(yield confirm('Delete all global states?', 'Ok')))
                return;
            if (!(yield confirm('Are you sure?', 'Ok')))
                return;
            createBackup(context, dirname, `${formatDate(new Date())}-auto.json`);
            updateFavorites(context, undefined);
            updateFavoriteGroups(context, undefined);
            updateHistory(context, undefined);
            updateComparisons(context, undefined);
            showMessageReload('Cleared global state');
        }),
    });
}
function createBackup(context, dirname, basename) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs__namespace.existsSync(dirname))
            fs__namespace.mkdirSync(dirname, { recursive: true });
        const filename = path__namespace.join(dirname, basename);
        const content = {
            comparisons: getComparisons(context),
            favorites: getFavorites(context),
            favoriteGroups: getFavoriteGroups(context),
            history: getHistory(context),
        };
        fs__namespace.writeFileSync(filename, JSON.stringify(content, null, '\t'), 'utf-8');
        const value = yield vscode__namespace.window.showInformationMessage(`Created file "${basename}"`, 'Go to File');
        if (value)
            reveal(filename);
    });
}
function selectBackup(dirname) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!fs__namespace.existsSync(dirname)) {
            vscode__namespace.window.showInformationMessage('No backups available');
            return;
        }
        const filenames = fs__namespace.readdirSync(dirname);
        const items = filenames.filter((name) => findBackupFileName.test(name)).map((label) => ({ label }));
        if (!items.length) {
            vscode__namespace.window.showInformationMessage('No backups available');
            return;
        }
        return yield vscode__namespace.window.showQuickPick(items, {
            placeHolder: 'Please select a backup to restore',
        });
    });
}
function formatDate(date) {
    return `${date.getFullYear()}-${formatDigit(date.getMonth() + 1)}-${formatDigit(date.getDate())}-${formatDigit(date.getHours())}-${formatDigit(date.getMinutes())}-${formatDigit(date.getSeconds())}`;
}
function formatDigit(digit) {
    return `${digit}`.padStart(2, '0');
}
function showMessageReload(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const reload = yield vscode__namespace.window.showInformationMessage(text, 'Reload Window');
        if (reload)
            vscode__namespace.commands.executeCommand('workbench.action.reloadWindow');
    });
}

function activate$9(context) {
    let folderUri = null;
    register(context, {
        'l13Diff.action.explorer.selectForCompare': (uri) => {
            if (!folderUri)
                vscode__namespace.commands.executeCommand('setContext', 'l13DiffSelectedFolder', true);
            folderUri = uri;
        },
        'l13Diff.action.explorer.compareWithSelected': (uri) => {
            vscode__namespace.commands.executeCommand('l13Diff.action.panel.openAndCompare', folderUri, uri);
        },
        'l13Diff.action.explorer.compareSelected': (uri, uris) => {
            vscode__namespace.commands.executeCommand('l13Diff.action.panel.openAndCompare', uris[0], uris[1]);
        },
        'l13Diff.action.projects.selectForCompare': ({ project }) => {
            if (!folderUri)
                vscode__namespace.commands.executeCommand('setContext', 'l13DiffSelectedFolder', true);
            folderUri = vscode__namespace.Uri.file(project.path);
        },
        'l13Diff.action.projects.compareWithSelected': ({ project }) => {
            vscode__namespace.commands.executeCommand('l13Diff.action.panel.openAndCompare', folderUri, vscode__namespace.Uri.file(project.path));
        },
    });
}

const MAX_TOTAL_IMPORT = 1000;
const MAX_FILE_SIZE = 1024 * 1024;
const findJSONExt = /\.json$/i;
const options = {
    filters: {
        Favorites: ['json'],
    },
};
class FavoriteGroupsDialog {
    static create(favoriteGroupsState, favoritesState) {
        return FavoriteGroupsDialog.current || (FavoriteGroupsDialog.current = new FavoriteGroupsDialog(favoriteGroupsState, favoritesState));
    }
    constructor(favoriteGroupsState, favoritesState) {
        this.favoriteGroupsState = favoriteGroupsState;
        this.favoritesState = favoritesState;
    }
    add() {
        return __awaiter(this, void 0, void 0, function* () {
            const label = yield vscode__namespace.window.showInputBox({
                placeHolder: 'Please enter a name for the group.',
            });
            if (!label)
                return;
            if (this.favoriteGroupsState.getByName(label)) {
                vscode__namespace.window.showInformationMessage(`Favorite group with name "${label}" exists!`);
                return;
            }
            this.favoriteGroupsState.add(label);
            return this.favoriteGroupsState.getByName(label);
        });
    }
    addFavoriteToGroup(favorite) {
        return __awaiter(this, void 0, void 0, function* () {
            const favoriteGroups = this.favoriteGroupsState.get();
            let favoriteGroup = null;
            if (favoriteGroups.length) {
                const newFavoriteGroupItem = { label: '$(add) New Group...' };
                const items = [
                    newFavoriteGroupItem,
                    ...favoriteGroups,
                ];
                const selectedItem = yield vscode__namespace.window.showQuickPick(items, {
                    placeHolder: 'Select a favorite group',
                });
                if (selectedItem === newFavoriteGroupItem) {
                    favoriteGroup = yield this.add();
                }
                else
                    favoriteGroup = selectedItem;
            }
            else
                favoriteGroup = yield this.add();
            if (!favoriteGroup)
                return;
            this.favoritesState.addFavoriteToGroup(favorite, favoriteGroup.id);
        });
    }
    openMultipleDiffPanels(favoriteGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            const favorites = this.favoritesState.getFavoritesByGroup(favoriteGroup);
            if (favorites.length > 3 && get('confirmOpenMultipleDiffPanels', true)) {
                const buttonCompareDontShowAgain = 'Compare, don\'t show again';
                const text = `Open "${favoriteGroup.label}" with ${favorites.length} comparisons in multiple diff panels at once?`;
                const value = yield confirm(text, 'Compare', buttonCompareDontShowAgain);
                if (!value)
                    return null;
                if (value === buttonCompareDontShowAgain)
                    update('confirmOpenMultipleDiffPanels', false);
            }
            return favorites;
        });
    }
    rename(favoriteGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            const label = yield vscode__namespace.window.showInputBox({
                placeHolder: 'Please enter a new name for the group.',
                value: favoriteGroup.label,
            });
            if (!label || favoriteGroup.label === label)
                return;
            if (this.favoriteGroupsState.getByName(label)) {
                vscode__namespace.window.showInformationMessage(`Favorite group with name "${label}" exists!`);
                return;
            }
            this.favoriteGroupsState.rename(favoriteGroup, label);
        });
    }
    remove(favoriteGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            const buttonDeleteGroupAndFavorites = 'Delete Group and Favorites';
            const buttons = ['Delete'];
            const favorites = this.favoritesState.getFavoritesByGroup(favoriteGroup);
            if (favorites.length)
                buttons.push(buttonDeleteGroupAndFavorites);
            const value = yield confirm(`Delete favorite group "${favoriteGroup.label}"?`, ...buttons);
            if (!value)
                return;
            this.favoriteGroupsState.remove(favoriteGroup, value === buttonDeleteGroupAndFavorites);
        });
    }
    export() {
        return __awaiter(this, void 0, void 0, function* () {
            const uri = yield vscode__namespace.window.showSaveDialog(options);
            if (uri) {
                const favorites = this.favoritesState.get();
                const content = JSON.stringify([
                    ...this.favoriteGroupsState.get().map((favoriteGroup) => ({
                        label: favoriteGroup.label,
                        favorites: favorites
                            .filter((favorite) => favoriteGroup.id === favorite.groupId)
                            .map((favorite) => ({
                            label: favorite.label,
                            pathA: favorite.fileA,
                            pathB: favorite.fileB,
                        })),
                    })),
                    ...favorites
                        .filter((favorite) => typeof favorite.groupId === 'undefined')
                        .map((favorite) => ({
                        label: favorite.label,
                        pathA: favorite.fileA,
                        pathB: favorite.fileB,
                    })),
                ], null, '\t');
                let fsPath = uri.fsPath;
                if (!findJSONExt.test(fsPath))
                    fsPath += '.json';
                fs__namespace.writeFileSync(fsPath, content, 'utf-8');
            }
        });
    }
    import() {
        return __awaiter(this, void 0, void 0, function* () {
            const fsPath = yield openFile$1(options);
            if (fsPath) {
                const buttonDeleteAllAndImport = 'Delete All & Import';
                const result = yield confirm(`Import favorites from "${fsPath}"?`, 'Import', buttonDeleteAllAndImport);
                if (!result)
                    return;
                if (result === buttonDeleteAllAndImport)
                    this.favoritesState.clear();
                try {
                    const stat = fs__namespace.statSync(fsPath);
                    if (stat.size > MAX_FILE_SIZE) {
                        vscode__namespace.window.showErrorMessage(`The file "${fsPath}" exceeds the size of 1 MB.`);
                        return;
                    }
                }
                catch (error) {
                    vscode__namespace.window.showErrorMessage(`Cannot find file "${fsPath}".`);
                    return;
                }
                let content = null;
                try {
                    content = fs__namespace.readFileSync(fsPath, 'utf-8');
                }
                catch (error) {
                    vscode__namespace.window.showErrorMessage(`Cannot read file "${fsPath}".`);
                    return;
                }
                let json = null;
                try {
                    json = JSON.parse(content);
                }
                catch (error) {
                    vscode__namespace.window.showErrorMessage(`Cannot parse JSON in file "${fsPath}".`);
                    return;
                }
                if (Array.isArray(json)) {
                    const favorites = [];
                    let count = 0;
                    loop: for (const item of json) {
                        if (!isValidFavoriteImport(item))
                            continue loop;
                        if (exceedsImportRangeLimit(++count))
                            break loop;
                        if (Array.isArray(item.favorites)) {
                            const groupId = this.favoriteGroupsState.import(item.label).id;
                            subloop: for (const favorite of item.favorites) {
                                if (!isValidFavoriteImport(favorite))
                                    continue subloop;
                                if (exceedsImportRangeLimit(++count))
                                    break loop;
                                prepareImportFavorite(favorites, favorite, groupId);
                            }
                        }
                        else
                            prepareImportFavorite(favorites, item);
                    }
                    this.favoritesState.import(favorites);
                    vscode__namespace.window.showInformationMessage(`Imported ${count > MAX_TOTAL_IMPORT ? MAX_TOTAL_IMPORT : count} favorites and groups from "${fsPath}".`);
                }
                else {
                    vscode__namespace.window.showErrorMessage('The JSON data is not an array.');
                }
            }
        });
    }
}
FavoriteGroupsDialog.current = null;
function isValidFavoriteImport(item) {
    return item && typeof item === 'object' && item.label && typeof item.label === 'string';
}
function prepareImportFavorite(favorites, favorite, groupId) {
    favorites.push({
        label: favorite.label,
        pathA: typeof favorite.pathA === 'string' ? favorite.pathA : '',
        pathB: typeof favorite.pathB === 'string' ? favorite.pathB : '',
        groupId,
    });
}
function exceedsImportRangeLimit(total) {
    if (total > MAX_TOTAL_IMPORT) {
        vscode__namespace.window.showWarningMessage(`Import exceeds the limit of ${MAX_TOTAL_IMPORT} favorites or groups.`);
        return true;
    }
    return false;
}

class FavoritesDialog {
    static create(favoriteState) {
        return FavoritesDialog.current || (FavoritesDialog.current = new FavoritesDialog(favoriteState));
    }
    constructor(favoriteState) {
        this.favoriteState = favoriteState;
    }
    add(fileA, fileB) {
        return __awaiter(this, void 0, void 0, function* () {
            const label = yield vscode__namespace.window.showInputBox({
                placeHolder: 'Please enter a name for the diff',
                value: `${fileA} ↔ ${fileB}`,
            });
            if (!label)
                return;
            const favorite = this.favoriteState.getByName(label);
            if (favorite) {
                if (!(yield confirm(`Overwrite favorite "${label}"?`, 'Ok')))
                    return;
                this.favoriteState.remove(favorite);
            }
            this.favoriteState.add(label, fileA, fileB, favorite === null || favorite === void 0 ? void 0 : favorite.groupId);
        });
    }
    rename(favorite) {
        return __awaiter(this, void 0, void 0, function* () {
            const label = yield vscode__namespace.window.showInputBox({
                placeHolder: 'Please enter a new name for the diff',
                value: favorite.label,
            });
            if (!label || favorite.label === label)
                return;
            if (this.favoriteState.getByName(label)) {
                vscode__namespace.window.showErrorMessage(`Favorite diff with the name "${label}" exists!`);
                return;
            }
            this.favoriteState.rename(favorite, label);
        });
    }
    remove(favorite) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield confirm(`Delete favorite "${favorite.label}"?`, 'Delete')) {
                this.favoriteState.remove(favorite);
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield confirm('Delete all favorites and groups?', 'Delete')) {
                this.favoriteState.clear();
            }
        });
    }
}
FavoritesDialog.current = null;

const UTF16BE_EOL = Buffer.from([0, 13]);
const UTF16LE_EOL = Buffer.from([13, 0]);
const UTF16BE_TAB = Buffer.from([0, 9]);
const UTF16LE_TAB = Buffer.from([9, 0]);
const UTF16BE_SPACE = Buffer.from([0, 32]);
const UTF16LE_SPACE = Buffer.from([32, 0]);
function detectUTFBOM(buffer) {
    if (hasUTF16BEBOM(buffer))
        return 2;
    if (hasUTF16LEBOM(buffer))
        return 3;
    if (hasUTF8BOM(buffer))
        return 1;
    return 0;
}
function removeUTFBOM(buffer, bom, diff, modified) {
    if (bom) {
        diff.ignoredBOM += modified;
        return buffer.subarray(bom === 1 ? 3 : 2);
    }
    return buffer;
}
function normalizeLineEnding(buffer, bom, diff, modified) {
    if (bom === 2)
        return normalizeUTF16BE(buffer, diff, modified);
    if (bom === 3)
        return normalizeUTF16LE(buffer, diff, modified);
    return normalizeAscii(buffer, diff, modified);
}
function trimWhitespace(buffer, bom, diff, modified) {
    if (bom === 2)
        return trimUTF16BE(buffer, diff, modified);
    if (bom === 3)
        return trimUTF16LE(buffer, diff, modified);
    return trimAscii(buffer, diff, modified);
}
function hasUTF8BOM(buffer) {
    return buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191;
}
function hasUTF16BEBOM(buffer) {
    return buffer[0] === 254 && buffer[1] === 255;
}
function hasUTF16LEBOM(buffer) {
    return buffer[0] === 255 && buffer[1] === 254;
}
function normalizeAscii(buffer, diff, modified) {
    if (!buffer.includes(13))
        return buffer;
    const length = buffer.length;
    const cache = [];
    let i = 0;
    while (i < length) {
        const value = buffer[i++];
        if (value === 13) {
            if (buffer[i] !== 10)
                cache.push(10);
        }
        else
            cache.push(value);
    }
    diff.ignoredEOL += modified;
    return Buffer.from(cache);
}
function normalizeUTF16BE(buffer, diff, modified) {
    if (buffer.indexOf(UTF16BE_EOL) === -1)
        return buffer;
    const length = buffer.length;
    const cache = [];
    let i = 0;
    while (i < length) {
        const valueA = buffer[i++];
        const valueB = buffer[i++];
        if (valueA === 0 && valueB === 13) {
            if (!(buffer[i] === 0 && buffer[i + 1] === 10))
                cache.push(0, 10);
        }
        else
            cache.push(valueA, valueB);
    }
    diff.ignoredEOL += modified;
    return Buffer.from(cache);
}
function normalizeUTF16LE(buffer, diff, modified) {
    if (buffer.indexOf(UTF16LE_EOL) === -1)
        return buffer;
    const length = buffer.length;
    const cache = [];
    let i = 0;
    while (i < length) {
        const valueA = buffer[i++];
        const valueB = buffer[i++];
        if (valueA === 13 && valueB === 0) {
            if (!(buffer[i] === 10 && buffer[i + 1] === 0))
                cache.push(10, 0);
        }
        else
            cache.push(valueA, valueB);
    }
    diff.ignoredEOL += modified;
    return Buffer.from(cache);
}
function trimAscii(buffer, diff, modified) {
    if (!(buffer.includes(9) || buffer.includes(32)))
        return buffer;
    const length = buffer.length;
    const newBuffer = hasUTF8BOM(buffer) ? [239, 187, 191] : [];
    let cache = [];
    let i = newBuffer.length;
    const fixBOM = i;
    stream: while (i < length) {
        const value = buffer[i++];
        if (value === 10 || value === 13 || i === length) {
            if (i === length && !(value === 10 || value === 13))
                cache.push(value);
            let j = 0;
            let k = cache.length;
            start: while (j < k) {
                const cacheValue = cache[j];
                if (cacheValue === 9 || cacheValue === 32) {
                    j++;
                    continue start;
                }
                break start;
            }
            if (k === j) {
                if (cache.length === length - fixBOM) {
                    const cacheLengthA = cache.length;
                    for (let l = 0; l < cacheLengthA; l++)
                        newBuffer.push(cache[l]);
                }
                else if (value === 10 || value === 13)
                    newBuffer.push(value);
                cache = [];
                continue stream;
            }
            end: while (k > j) {
                const cacheValue = cache[k - 1];
                if (cacheValue === 9 || cacheValue === 32) {
                    k--;
                    continue end;
                }
                break end;
            }
            cache = cache.slice(j, k);
            const cacheLengthB = cache.length;
            for (let m = 0; m < cacheLengthB; m++)
                newBuffer.push(cache[m]);
            if (value === 10 || value === 13)
                newBuffer.push(value);
            cache = [];
        }
        else
            cache.push(value);
    }
    diff.ignoredWhitespace += modified;
    return Buffer.from(newBuffer);
}
function trimUTF16BE(buffer, diff, modified) {
    if (buffer.indexOf(UTF16BE_TAB) === -1 && buffer.indexOf(UTF16BE_SPACE) === -1)
        return buffer;
    const newBuffer = hasUTF16BEBOM(buffer) ? [buffer[0], buffer[1]] : [];
    const length = buffer.length;
    let cache = [];
    let i = newBuffer.length;
    const vscodeFix = i;
    stream: while (i < length) {
        const valueA = buffer[i++];
        const valueB = buffer[i++];
        if (valueA === 0 && (valueB === 10 || valueB === 13) || i === length) {
            if (i === length && !(valueA === 0 && (valueB === 10 || valueB === 13)))
                cache.push(valueA, valueB);
            let j = 0;
            let k = cache.length;
            start: while (j < k) {
                const cacheValueA = cache[j];
                const cacheValueB = cache[j + 1];
                if (cacheValueA === 0 && (cacheValueB === 9 || cacheValueB === 32)) {
                    j += 2;
                    continue start;
                }
                break start;
            }
            if (j === k) {
                if (cache.length === length - vscodeFix) {
                    const cacheLengthA = cache.length;
                    for (let l = 0; l < cacheLengthA; l++)
                        newBuffer.push(cache[l]);
                }
                else if (valueA === 0 && (valueB === 10 || valueB === 13))
                    newBuffer.push(valueA, valueB);
                cache = [];
                continue stream;
            }
            end: while (k > j) {
                const cacheValueA = cache[k - 2];
                const cacheValueB = cache[k - 1];
                if (cacheValueA === 0 && (cacheValueB === 9 || cacheValueB === 32)) {
                    k -= 2;
                    continue end;
                }
                break end;
            }
            cache = cache.slice(j, k);
            const cacheLengthB = cache.length;
            for (let m = 0; m < cacheLengthB; m++)
                newBuffer.push(cache[m]);
            if (valueA === 0 && (valueB === 10 || valueB === 13))
                newBuffer.push(valueA, valueB);
            cache = [];
        }
        else
            cache.push(valueA, valueB);
    }
    diff.ignoredWhitespace += modified;
    return Buffer.from(newBuffer);
}
function trimUTF16LE(buffer, diff, modified) {
    if (buffer.indexOf(UTF16LE_TAB) === -1 && buffer.indexOf(UTF16LE_SPACE) === -1)
        return buffer;
    const newBuffer = hasUTF16LEBOM(buffer) ? [buffer[0], buffer[1]] : [];
    const length = buffer.length;
    let cache = [];
    let i = newBuffer.length;
    const vscodeFix = i;
    stream: while (i < length) {
        const valueA = buffer[i++];
        const valueB = buffer[i++];
        if (valueB === 0 && (valueA === 10 || valueA === 13) || i === length) {
            if (i === length && !(valueB === 0 && (valueA === 10 || valueA === 13)))
                cache.push(valueA, valueB);
            let j = 0;
            let k = cache.length;
            start: while (j < k) {
                const cacheValueA = cache[j];
                const cacheValueB = cache[j + 1];
                if (cacheValueB === 0 && (cacheValueA === 9 || cacheValueA === 32)) {
                    j += 2;
                    continue start;
                }
                break start;
            }
            if (j === k) {
                if (cache.length === length - vscodeFix) {
                    const cacheLengthA = cache.length;
                    for (let l = 0; l < cacheLengthA; l++)
                        newBuffer.push(cache[l]);
                }
                else if (valueB === 0 && (valueA === 10 || valueA === 13))
                    newBuffer.push(valueA, valueB);
                cache = [];
                continue stream;
            }
            end: while (k > j) {
                const cacheValueA = cache[k - 2];
                const cacheValueB = cache[k - 1];
                if (cacheValueB === 0 && (cacheValueA === 9 || cacheValueA === 32)) {
                    k -= 2;
                    continue end;
                }
                break end;
            }
            cache = cache.slice(j, k);
            const cacheLengthB = cache.length;
            for (let m = 0; m < cacheLengthB; m++)
                newBuffer.push(cache[m]);
            if (valueB === 0 && (valueA === 10 || valueA === 13))
                newBuffer.push(valueA, valueB);
            cache = [];
        }
        else
            cache.push(valueA, valueB);
    }
    diff.ignoredWhitespace += modified;
    return Buffer.from(newBuffer);
}

const findRegExpChars = /([\\\[\]\.\*\^\$\|\+\-\{\}\(\)\?\!\=\:\,])/g;
const findStartDot = /^\./;
let findExtensions = null;
let filenames = [];
let findAssociations = null;
function isTextFile(basename) {
    return findExtensions.test(basename)
        || filenames.includes(basename)
        || findAssociations && findAssociations.test(basename);
}
function buildWhitelistForTextFiles() {
    const config = vscode__namespace.workspace.getConfiguration();
    const extensions = ['*.txt'];
    filenames = [];
    vscode__namespace.extensions.all.forEach((extension) => {
        var _a, _b;
        const packageJSON = extension.packageJSON;
        (_b = (_a = packageJSON.contributes) === null || _a === void 0 ? void 0 : _a.languages) === null || _b === void 0 ? void 0 : _b.forEach((language) => {
            var _a;
            (_a = language.extensions) === null || _a === void 0 ? void 0 : _a.forEach((extname) => {
                extensions.push((findStartDot.test(extname) ? '*' : '') + extname);
            });
            if (language.filenames)
                filenames.push(...language.filenames);
        });
    });
    extensions.sort();
    findExtensions = createFindGlob(extensions);
    filenames.sort();
    if (config.has('files.associations')) {
        findAssociations = createFindGlob(Object.keys(config.get('files.associations', {})));
    }
    else
        findAssociations = null;
}
function createFindGlob(ignore) {
    return new RegExp(`^(${ignore.map((value) => escapeForRegExp(value)).join('|')})$`, 'i');
}
function escapeForRegExp(text) {
    return `${text}`.replace(findRegExpChars, (match) => {
        if (match === '*')
            return '.*';
        if (match === '?')
            return '.';
        return `\\${match}`;
    });
}

const findPlaceholder = /^\$\{workspaceFolder(?:\:((?:\\\}|[^\}])*))?\}/;
const findEscapedEndingBrace = /\\\}/g;
function workspacePaths(workspaceFolders) {
    return (workspaceFolders || []).map((item) => item.uri.fsPath);
}
function parsePredefinedVariable(pathname, ignoreErrors = false) {
    return pathname.replace(findPlaceholder, function (match, name) {
        const workspaceFolders = vscode__namespace.workspace.workspaceFolders;
        if (!workspaceFolders) {
            if (!ignoreErrors)
                vscode__namespace.window.showErrorMessage('No workspace folder available!');
            return match;
        }
        if (!name)
            return workspaceFolders[0].uri.fsPath;
        name = name.replace(findEscapedEndingBrace, '}');
        for (const workspaceFolder of workspaceFolders) {
            if (workspaceFolder.name === name)
                return workspaceFolder.uri.fsPath;
        }
        if (!ignoreErrors)
            vscode__namespace.window.showErrorMessage(`No workspace folder with name "${name}" available!`);
        return match;
    });
}

class DiffOutput {
    constructor() {
        this.lines = [];
        if (!DiffOutput.output) {
            DiffOutput.output = vscode__namespace.window.createOutputChannel('Diff Folders');
        }
        DiffOutput.currentOutput = this;
        DiffOutput.outputs.push(this);
        this.clear();
    }
    activate() {
        if (DiffOutput.currentOutput !== this) {
            DiffOutput.currentOutput = this;
            DiffOutput.output.clear();
            this.lines.forEach((line) => DiffOutput.output.appendLine(line));
        }
    }
    log(text) {
        this.msg(`[${createTimestamp()}] ${text}`);
    }
    msg(line = '') {
        this.lines.push(line);
        if (DiffOutput.currentOutput === this)
            DiffOutput.output.appendLine(line);
    }
    show() {
        if (DiffOutput.currentOutput === this)
            DiffOutput.output.show();
    }
    hide() {
        if (DiffOutput.currentOutput === this)
            DiffOutput.output.hide();
    }
    clear() {
        this.lines = [];
        if (DiffOutput.currentOutput === this)
            DiffOutput.output.clear();
    }
    dispose() {
        remove(DiffOutput.outputs, this);
        if (!DiffOutput.outputs.length && DiffOutput.output) {
            DiffOutput.output.clear();
            DiffOutput.output.dispose();
            DiffOutput.output = undefined;
        }
    }
}
DiffOutput.outputs = [];
function createTimestamp() {
    const now = new Date();
    const hours = `${now.getHours()}`;
    const minutes = `${now.getMinutes()}`;
    const seconds = `${now.getSeconds()}`;
    return `${padStart(hours, 2, '0')}:${padStart(minutes, 2, '0')}:${padStart(seconds, 2, '0')}`;
}
function padStart(str, length, pad) {
    while (str.length < length)
        str = pad + str;
    return str;
}

class DiffResult {
    constructor(pathA, pathB, settings) {
        this.pathA = pathA;
        this.pathB = pathB;
        this.settings = settings;
        this.diffs = [];
    }
}

const BUFFER_MAX_LENGTH = buffer.constants.MAX_LENGTH;
const MAX_CACHE_BUFFER_LENGTH = 33554432;
class DiffCompare {
    constructor() {
        this._onWillCompare = new vscode__namespace.EventEmitter();
        this.onWillCompare = this._onWillCompare.event;
        this._onDidNotCompare = new vscode__namespace.EventEmitter();
        this.onDidNotCompare = this._onDidNotCompare.event;
        this._onWillCompareFiles = new vscode__namespace.EventEmitter();
        this.onWillCompareFiles = this._onWillCompareFiles.event;
        this._onDidCompareFiles = new vscode__namespace.EventEmitter();
        this.onDidCompareFiles = this._onDidCompareFiles.event;
        this._onWillCompareFolders = new vscode__namespace.EventEmitter();
        this.onWillCompareFolders = this._onWillCompareFolders.event;
        this._onDidCompareFolders = new vscode__namespace.EventEmitter();
        this.onDidCompareFolders = this._onDidCompareFolders.event;
        this._onDidUpdateDiff = new vscode__namespace.EventEmitter();
        this.onDidUpdateDiff = this._onDidUpdateDiff.event;
        this._onDidUpdateAllDiffs = new vscode__namespace.EventEmitter();
        this.onDidUpdateAllDiffs = this._onDidUpdateAllDiffs.event;
        this._onWillScanFolder = new vscode__namespace.EventEmitter();
        this.onWillScanFolder = this._onWillScanFolder.event;
        this._onDidScanFolder = new vscode__namespace.EventEmitter();
        this.onDidScanFolder = this._onDidScanFolder.event;
    }
    initCompare(data) {
        this._onWillCompare.fire(undefined);
        let pathA = parsePredefinedVariable(data.pathA);
        let pathB = parsePredefinedVariable(data.pathB);
        if (!pathA)
            return this.onError('The left path is empty.', pathA, pathB);
        if (!pathB)
            return this.onError('The right path is empty.', pathA, pathB);
        pathA = sanitize(pathA);
        pathB = sanitize(pathB);
        if (!path.isAbsolute(pathA))
            return this.onError('The left path is not absolute.', pathA, pathB);
        if (!path.isAbsolute(pathB))
            return this.onError('The right path is not absolute.', pathA, pathB);
        pathA = vscode__namespace.Uri.file(pathA).fsPath;
        pathB = vscode__namespace.Uri.file(pathB).fsPath;
        if (pathA === pathB)
            return this.onError('The left and right path is the same.', pathA, pathB);
        const statA = lstatSync(pathA);
        if (!statA)
            return this.onError(`The left path "${pathA}" does not exist.`, pathA, pathB);
        const statB = lstatSync(pathB);
        if (!statB)
            return this.onError(`The right path "${pathB}" does not exist.`, pathA, pathB);
        if (statA.isFile() && statB.isFile())
            this.compareFiles(data, pathA, pathB);
        else if (statA.isDirectory() && statB.isDirectory())
            this.compareFolders(data, pathA, pathB);
        else
            this.onError('The left and right path can\'t be compared!', pathA, pathB);
    }
    updateDiffs(data) {
        data.diffs.forEach((diff) => {
            diff.fileA.stat = lstatSync(diff.fileA.fsPath);
            diff.fileB.stat = lstatSync(diff.fileB.fsPath);
            compareDiff(diff, data.settings);
            this._onDidUpdateDiff.fire(diff);
        });
        this._onDidUpdateAllDiffs.fire(data);
    }
    compareFiles(data, pathA, pathB) {
        const left = vscode__namespace.Uri.file(pathA);
        const right = vscode__namespace.Uri.file(pathB);
        const openToSide = get('openToSide', false);
        this._onWillCompareFiles.fire({ data, pathA, pathB });
        vscode__namespace.commands.executeCommand('vscode.diff', left, right, `${pathA} ↔ ${pathB}`, {
            preview: false,
            viewColumn: openToSide ? vscode__namespace.ViewColumn.Beside : vscode__namespace.ViewColumn.Active,
        });
        this._onDidCompareFiles.fire(new DiffResult(pathA, pathB, null));
    }
    compareFolders(data, pathA, pathB) {
        return __awaiter(this, void 0, void 0, function* () {
            this._onWillCompareFolders.fire({ data, pathA, pathB });
            const diffSettings = yield getDiffSettings(pathA, pathB);
            try {
                const diffResult = yield this.createDiffs(pathA, pathB, diffSettings);
                this._onDidCompareFolders.fire(diffResult);
            }
            catch (error) {
                this.onError(error, pathA, pathB, diffSettings);
            }
        });
    }
    onError(error, pathA, pathB, diffSettings) {
        const buttons = [];
        if (diffSettings)
            buttons.push('Show Output');
        vscode__namespace.window.showErrorMessage(`${error}`, ...buttons).then((value) => {
            var _a;
            if (value)
                (_a = DiffOutput.currentOutput) === null || _a === void 0 ? void 0 : _a.show();
        });
        this._onDidNotCompare.fire({ diffSettings, error, pathA, pathB });
    }
    scanFolder(dirname, { abortOnError, excludes, useCaseSensitive, maxFileSize }) {
        return __awaiter(this, void 0, void 0, function* () {
            this._onWillScanFolder.fire(dirname);
            const result = yield walkTree(dirname, { abortOnError, excludes, useCaseSensitive, maxFileSize });
            this._onDidScanFolder.fire(result);
            return result;
        });
    }
    createDiffs(dirnameA, dirnameB, diffSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const diffResult = new DiffResult(dirnameA, dirnameB, diffSettings);
            const resultA = yield this.scanFolder(dirnameA, diffSettings);
            const resultB = yield this.scanFolder(dirnameB, diffSettings);
            const diffs = {};
            createListA(diffs, resultA, diffSettings);
            compareWithListB(diffs, resultB, diffSettings);
            diffResult.diffs = Object.keys(diffs).sort(sortCaseInsensitive).map((relative) => diffs[relative]);
            return diffResult;
        });
    }
}
function getDiffSettings(dirnameA, dirnameB) {
    return __awaiter(this, void 0, void 0, function* () {
        const useCaseSensitiveFileName = get('useCaseSensitiveFileName', 'detect');
        let useCaseSensitive = useCaseSensitiveFileName === 'detect' ? hasCaseSensitiveFileSystem : useCaseSensitiveFileName === 'on';
        if (hasCaseSensitiveFileSystem && !useCaseSensitive) {
            if (get('confirmCaseInsensitiveCompare', true)) {
                const buttonCompareDontShowAgain = 'Compare, don\'t show again';
                const text = 'The file system is case sensitive. Are you sure to compare case insensitive?';
                const value = yield confirm(text, 'Compare', buttonCompareDontShowAgain);
                if (value) {
                    if (value === buttonCompareDontShowAgain)
                        update('confirmCaseInsensitiveCompare', false);
                }
                else
                    useCaseSensitive = true;
            }
        }
        return {
            abortOnError: get('abortOnError', true),
            excludes: getExcludes(dirnameA, dirnameB),
            ignoreContents: get('ignoreContents', false),
            ignoreEndOfLine: get('ignoreEndOfLine', false),
            ignoreByteOrderMark: get('ignoreByteOrderMark', false),
            ignoreTrimWhitespace: ignoreTrimWhitespace(),
            maxFileSize: maxFileSize(),
            useCaseSensitive,
        };
    });
}
function createListA(diffs, result, diffSettings) {
    const useCaseSensitive = diffSettings.useCaseSensitive;
    Object.keys(result).forEach((pathname) => {
        const file = result[pathname];
        const id = useCaseSensitive ? file.name : file.name.toUpperCase();
        if (!diffs[id])
            addFile(diffs, id, file, null);
        else
            throw new URIError(`File "${file.fsPath}" exists! Please enable case sensitive file names.`);
    });
}
function compareWithListB(diffs, result, diffSettings) {
    const useCaseSensitive = diffSettings.useCaseSensitive;
    Object.keys(result).forEach((pathname) => {
        const file = result[pathname];
        const id = useCaseSensitive ? file.name : file.name.toUpperCase();
        const diff = diffs[id];
        if (diff) {
            if (!diff.fileB) {
                diff.fileB = file;
                if (file.ignore)
                    diff.status = 'ignored';
                compareDiff(diff, diffSettings);
            }
            else
                throw new URIError(`File "${file.fsPath}" exists! Please enable case sensitive file names.`);
        }
        else
            addFile(diffs, id, null, file);
    });
}
function compareDiff(diff, { ignoreContents, ignoreEndOfLine, ignoreTrimWhitespace, ignoreByteOrderMark }) {
    const fileA = diff.fileA;
    const fileB = diff.fileB;
    const typeA = fileA.type;
    if (typeA !== fileB.type) {
        diff.type = 'mixed';
        if (diff.status === 'ignored')
            return;
        diff.status = 'conflicting';
        return;
    }
    else if (diff.status === 'ignored')
        return;
    diff.status = 'unchanged';
    const sizeA = fileA.stat.size;
    const sizeB = fileB.stat.size;
    if (typeA === 'file') {
        if (ignoreContents) {
            if (sizeA !== sizeB)
                diff.status = 'modified';
        }
        else if ((ignoreByteOrderMark || ignoreEndOfLine || ignoreTrimWhitespace)
            && isTextFile(fileA.basename)
            && sizeA <= BUFFER_MAX_LENGTH
            && sizeB <= BUFFER_MAX_LENGTH) {
            let bufferA = fs__namespace.readFileSync(fileA.fsPath);
            let bufferB = fs__namespace.readFileSync(fileB.fsPath);
            if (sizeA === sizeB && bufferA.equals(bufferB))
                return;
            const bomA = detectUTFBOM(bufferA);
            const bomB = detectUTFBOM(bufferB);
            if (bomA && bomB && bomA !== bomB
                || bomA === 3 && bomB !== 3
                || bomA !== 3 && bomB === 3) {
                diff.status = 'modified';
                return;
            }
            const bom = bomA || bomB;
            if (ignoreByteOrderMark && bomA !== bomB) {
                if (bomA)
                    bufferA = removeUTFBOM(bufferA, bomA, diff, 1);
                if (bomB)
                    bufferB = removeUTFBOM(bufferB, bomB, diff, 2);
            }
            if (ignoreEndOfLine) {
                bufferA = normalizeLineEnding(bufferA, bom, diff, 1);
                bufferB = normalizeLineEnding(bufferB, bom, diff, 2);
            }
            if (ignoreTrimWhitespace) {
                bufferA = trimWhitespace(bufferA, bom, diff, 1);
                bufferB = trimWhitespace(bufferB, bom, diff, 2);
            }
            if (!bufferA.equals(bufferB))
                diff.status = 'modified';
        }
        else if (sizeA === sizeB) {
            if (sizeA <= MAX_CACHE_BUFFER_LENGTH) {
                const bufferA = fs__namespace.readFileSync(fileA.fsPath);
                const bufferB = fs__namespace.readFileSync(fileB.fsPath);
                if (!bufferA.equals(bufferB))
                    diff.status = 'modified';
            }
            else if (!hasSameContents(fileA.fsPath, fileB.fsPath))
                diff.status = 'modified';
        }
        else
            diff.status = 'modified';
    }
    else if (typeA === 'symlink') {
        if (sizeA === sizeB) {
            if (!ignoreContents) {
                const linkA = fs__namespace.readlinkSync(fileA.fsPath);
                const linkB = fs__namespace.readlinkSync(fileB.fsPath);
                if (linkA !== linkB)
                    diff.status = 'modified';
            }
        }
        else
            diff.status = 'modified';
    }
}
function addFile(diffs, id, fileA, fileB) {
    const file = fileA || fileB;
    diffs[id] = {
        id,
        status: file.ignore ? 'ignored' : fileA ? 'deleted' : 'untracked',
        type: file.type,
        ignoredEOL: 0,
        ignoredBOM: 0,
        ignoredWhitespace: 0,
        fileA,
        fileB,
    };
}
function hasSameContents(pathA, pathB) {
    let fdA;
    let fdB;
    try {
        fdA = fs__namespace.openSync(pathA, 'r');
        fdB = fs__namespace.openSync(pathB, 'r');
        const bufferA = Buffer.alloc(MAX_CACHE_BUFFER_LENGTH);
        const bufferB = Buffer.alloc(MAX_CACHE_BUFFER_LENGTH);
        while (true) {
            const sizeA = fs__namespace.readSync(fdA, bufferA, 0, MAX_CACHE_BUFFER_LENGTH, null);
            if (!sizeA)
                break;
            const sizeB = fs__namespace.readSync(fdB, bufferB, 0, MAX_CACHE_BUFFER_LENGTH, null);
            if (!sizeB)
                break;
            if (!bufferA.equals(bufferB))
                return false;
            if (sizeA < MAX_CACHE_BUFFER_LENGTH || sizeB < MAX_CACHE_BUFFER_LENGTH)
                break;
        }
        return true;
    }
    catch (error) {
        throw error;
    }
    finally {
        if (fdA)
            fs__namespace.closeSync(fdA);
        if (fdB)
            fs__namespace.closeSync(fdB);
    }
}

const pluralFiles = { size: 'files', 1: 'file' };
const pluralFolders = { size: 'folders', 1: 'folder' };
const pluralSymlinks = { size: 'symlinks', 1: 'symlink' };
const pluralErrors = { size: 'errors', 1: 'error' };
const pluralOthers = { size: 'others', 1: 'other' };
const pluralEntries = { size: 'entries', 1: 'entry' };
const pluralBytes = { size: 'Bytes', 1: 'Byte' };

const { floor: floor$1, log, pow } = Math;
const byteUnits = [pluralBytes.size, 'KB', 'MB', 'GB', 'TB', 'PB'];
const KB = 1024;
const logKB = log(KB);
function formatAmount(value, units) {
    return `${value} ${units[value] || units.size}`;
}
function formatFileSize(size) {
    const bytes = formatAmount(size, pluralBytes);
    if (size < KB)
        return bytes;
    let i = floor$1(log(size) / logKB);
    if (!byteUnits[i])
        i = byteUnits.length - 1;
    return `${parseFloat((size / pow(KB, i)).toFixed(2))} ${byteUnits[i]} (${bytes})`;
}
function formatList(values) {
    const length = values.length;
    return length > 2 ? `${values.slice(0, -1).join(', ')} and ${values[length - 1]}` : values.join(' and ');
}

class DiffCopy {
    constructor() {
        this._onDidCopyFile = new vscode__namespace.EventEmitter();
        this.onDidCopyFile = this._onDidCopyFile.event;
        this._onDidCopyFiles = new vscode__namespace.EventEmitter();
        this.onDidCopyFiles = this._onDidCopyFiles.event;
        this._onInitMultiCopy = new vscode__namespace.EventEmitter();
        this.onInitMultiCopy = this._onInitMultiCopy.event;
        this._onDidCancel = new vscode__namespace.EventEmitter();
        this.onDidCancel = this._onDidCancel.event;
    }
    copy(file, dest) {
        return __awaiter(this, void 0, void 0, function* () {
            const stat = yield lstat(file.fsPath);
            if (!stat)
                return Promise.reject(new Error(`'${file.fsPath}' doesn't exist!`));
            const statDest = yield lstat(dest);
            if (stat.isDirectory()) {
                if (!statDest || statDest.isDirectory()) {
                    if (!statDest)
                        createDirectory(dest);
                    return Promise.resolve(undefined);
                }
                return Promise.reject(new Error(`'${dest}' exists, but is not a folder!`));
            }
            else if (stat.isFile()) {
                if (!statDest || statDest.isFile())
                    return yield copyFile(file.fsPath, dest);
                return Promise.reject(new Error(`'${dest}' exists, but is not a file!`));
            }
            else if (stat.isSymbolicLink()) {
                if (!statDest || statDest.isSymbolicLink()) {
                    if (statDest)
                        fs__namespace.unlinkSync(dest);
                    return yield copySymbolicLink(file.fsPath, dest);
                }
                return Promise.reject(new Error(`'${dest}' exists, but is not a symbolic link!`));
            }
        });
    }
    showCopyFromToDialog(data, from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const confirmCopy = get('confirmCopy', true);
            const length = data.diffs.length;
            if (!length)
                return;
            if (confirmCopy && !data.multi) {
                const buttonCopyDontShowAgain = 'Copy, don\'t show again';
                const text = `Copy ${formatAmount(length, pluralFiles)} to "${data[`path${to}`]}"?`;
                const value = yield confirm(text, 'Copy', buttonCopyDontShowAgain);
                if (value) {
                    if (value === buttonCopyDontShowAgain)
                        update('confirmCopy', false);
                    this.copyFromTo(data, from, to);
                }
                else
                    this._onDidCancel.fire(undefined);
            }
            else
                this.copyFromTo(data, from, to);
        });
    }
    showMultiCopyFromToDialog(data, from) {
        return __awaiter(this, void 0, void 0, function* () {
            const ids = data.ids;
            const length = ids.length;
            if (!length)
                return;
            const folderFrom = from === 'left' ? data.pathA : data.pathB;
            const text = `Copy ${formatAmount(length, pluralFiles)} from "${folderFrom}" across all diff panels?`;
            const value = yield confirm(text, 'Copy');
            if (value)
                this._onInitMultiCopy.fire({ data, from });
            else
                this._onDidCancel.fire(undefined);
        });
    }
    copyFromTo(data, from, to) {
        const folderTo = to === 'A' ? data.pathA : data.pathB;
        const diffs = data.diffs;
        const job = {
            error: null,
            tasks: diffs.length,
            done: () => this._onDidCopyFiles.fire({ data, from, to }),
        };
        diffs.forEach((diff) => __awaiter(this, void 0, void 0, function* () {
            const fileFrom = from === 'A' ? diff.fileA : diff.fileB;
            if (fileFrom) {
                const fsPath = fileFrom.fsPath;
                if (yield lstat(fsPath)) {
                    let fileTo = to === 'A' ? diff.fileA : diff.fileB;
                    const relative = (fileTo === null || fileTo === void 0 ? void 0 : fileTo.relative) || fileFrom.relative;
                    const dest = path__namespace.join(folderTo, relative);
                    let copy = null;
                    if (!fileTo)
                        copy = yield existsCaseInsensitiveFileAndCopy(fsPath, folderTo, relative, dest);
                    if (copy !== false) {
                        try {
                            yield this.copy(fileFrom, dest);
                            if (copy === null) {
                                if (diff.status !== 'ignored')
                                    diff.status = 'unchanged';
                                if (!fileTo) {
                                    fileTo = copyDiffFile(fileFrom, folderTo, dest);
                                    if (to === 'A')
                                        diff.fileA = fileTo;
                                    else
                                        diff.fileB = fileTo;
                                }
                                fileTo.stat = yield lstat(dest);
                            }
                            this._onDidCopyFile.fire({ from: fileFrom, to: fileTo });
                        }
                        catch (error) {
                            vscode__namespace.window.showErrorMessage(formatError(error));
                        }
                    }
                }
            }
            job.tasks--;
            if (!job.tasks)
                job.done();
        }));
    }
}
function copyDiffFile(fileFrom, root, dest) {
    return {
        root,
        relative: fileFrom.relative,
        fsPath: dest,
        stat: null,
        path: dest + (fileFrom.type === 'folder' ? path__namespace.sep : ''),
        name: fileFrom.name,
        basename: fileFrom.basename,
        dirname: fileFrom.dirname,
        extname: fileFrom.extname,
        type: fileFrom.type,
        ignore: fileFrom.ignore,
    };
}
function getRealRelative(root, relative) {
    const names = relative.split(path__namespace.sep);
    let cwd = root;
    return path__namespace.join(...names.map((name) => {
        const cwdNames = fs__namespace.readdirSync(cwd);
        let cwdName;
        name = name.toUpperCase();
        for (cwdName of cwdNames) {
            if (cwdName.toUpperCase() === name)
                break;
        }
        cwd = path__namespace.join(cwd, cwdName);
        return cwdName;
    }));
}
function existsCaseInsensitiveFileAndCopy(fsPath, folderTo, relative, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!hasCaseSensitiveFileSystem && fs__namespace.existsSync(dest)) {
            if (!get('confirmCaseInsensitiveCopy', true))
                return true;
            const realRelative = getRealRelative(folderTo, relative);
            if (relative !== realRelative) {
                const buttonCopyDontShowAgain = 'Copy, don\'t show again';
                const text = `Overwrite content of file "${path__namespace.join(folderTo, realRelative)}" with file "${fsPath}"?`;
                const copy = yield confirm(text, 'Copy', buttonCopyDontShowAgain);
                if (copy === buttonCopyDontShowAgain)
                    update('confirmCaseInsensitiveCopy', false);
                return !!copy;
            }
        }
        return null;
    });
}

const selectableTrashDialog = {
    text: 'Which files should be moved to the trash?',
    textSingle: 'Which file should be moved to the trash?',
    buttonAll: 'Move All to Trash',
    buttonLeft: 'Move Left to Trash',
    buttonRight: 'Move Right to Trash',
};
const selectableDeleteDialog = {
    text: 'Which files should be permanently deleted?',
    textSingle: 'Which file should be permanently deleted?',
    buttonAll: 'Delete All',
    buttonLeft: 'Delete Left',
    buttonRight: 'Delete Right',
};
const simpleTrashDialog = {
    text: 'Are you sure to delete all selected files?',
    textSingle: 'Are you sure to delete the selected file?',
    buttonAll: 'Move to Trash',
    buttonOk: 'Move, don\'t show again',
};
const simpleDeleteDialog = {
    text: 'Are you sure to delete all selected files permanently?',
    textSingle: 'Are you sure to delete the selected file permanently?',
    buttonAll: 'Delete',
    buttonOk: 'Delete, don\'t show again',
};
class DiffDelete {
    constructor() {
        this._onDidDeleteFile = new vscode__namespace.EventEmitter();
        this.onDidDeleteFile = this._onDidDeleteFile.event;
        this._onDidDeleteFiles = new vscode__namespace.EventEmitter();
        this.onDidDeleteFiles = this._onDidDeleteFiles.event;
        this._onDidCancel = new vscode__namespace.EventEmitter();
        this.onDidCancel = this._onDidCancel.event;
    }
    showDeleteFileDialog(data, side) {
        return __awaiter(this, void 0, void 0, function* () {
            const diffs = data.diffs;
            if (!diffs.length)
                return;
            const useTrash = enableTrash();
            const confirmDelete = get('confirmDelete', true);
            const dialog = useTrash ? simpleTrashDialog : simpleDeleteDialog;
            if (confirmDelete) {
                const value = yield confirm(dialog.textSingle, dialog.buttonAll, dialog.buttonOk);
                if (value) {
                    if (value === dialog.buttonOk)
                        update('confirmDelete', false);
                    this.deleteFiles(data, side, useTrash);
                }
                else
                    this._onDidCancel.fire(undefined);
            }
            else
                this.deleteFiles(data, side, useTrash);
        });
    }
    showDeleteFilesDialog(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const diffs = data.diffs;
            if (!diffs.length)
                return;
            let sides = 0;
            let selectSide = false;
            for (const diff of diffs) {
                if (diff.fileA)
                    sides |= 1;
                if (diff.fileB)
                    sides |= 2;
                if (sides === 3) {
                    selectSide = true;
                    break;
                }
            }
            const useTrash = enableTrash();
            const confirmDelete = get('confirmDelete', true);
            if (confirmDelete || selectSide) {
                let dialog = null;
                const args = [];
                if (selectSide) {
                    dialog = useTrash ? selectableTrashDialog : selectableDeleteDialog;
                    if (process.platform === 'win32')
                        args.push(dialog.buttonLeft, dialog.buttonRight);
                    else
                        args.push(dialog.buttonRight, dialog.buttonLeft);
                }
                else {
                    dialog = useTrash ? simpleTrashDialog : simpleDeleteDialog;
                    args.push(dialog.buttonOk);
                }
                const text = diffs.length > 2 ? dialog.text : dialog.textSingle;
                const value = yield confirm(text, dialog.buttonAll, ...args);
                if (value) {
                    if (value === dialog.buttonOk)
                        update('confirmDelete', false, true);
                    this.deleteFiles(data, value === dialog.buttonLeft ? 'left' : value === dialog.buttonRight ? 'right' : 'all', useTrash);
                }
                else
                    this._onDidCancel.fire(undefined);
            }
            else
                this.deleteFiles(data, 'all', useTrash);
        });
    }
    deleteFile(diffs, pathname, useTrash) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vscode__namespace.workspace.fs.delete(vscode__namespace.Uri.file(pathname), {
                    recursive: true,
                    useTrash,
                });
            }
            catch (error) {
                return vscode__namespace.window.showErrorMessage(formatError(error));
            }
            let file = null;
            for (const diff of diffs) {
                if (((_a = diff.fileA) === null || _a === void 0 ? void 0 : _a.path) === pathname)
                    file = diff.fileA;
                if (((_b = diff.fileB) === null || _b === void 0 ? void 0 : _b.path) === pathname)
                    file = diff.fileB;
                if (file) {
                    this._onDidDeleteFile.fire(file);
                    file = null;
                }
                if ((_c = diff.fileA) === null || _c === void 0 ? void 0 : _c.path.startsWith(pathname))
                    diff.fileA = null;
                if ((_d = diff.fileB) === null || _d === void 0 ? void 0 : _d.path.startsWith(pathname))
                    diff.fileB = null;
            }
        });
    }
    deleteFiles(data, side, useTrash) {
        return __awaiter(this, void 0, void 0, function* () {
            const diffs = data.diffs;
            const folders = [];
            const files = [];
            for (const diff of diffs) {
                const fileA = diff.fileA;
                if (fileA && (side === 'all' || side === 'left')) {
                    separateFilesAndFolders(fileA, folders, files);
                }
                const fileB = diff.fileB;
                if (fileB && (side === 'all' || side === 'right')) {
                    separateFilesAndFolders(fileB, folders, files);
                }
            }
            removeSubfiles(folders.slice(), folders);
            removeSubfiles(folders, files);
            const promises = [];
            for (const file of [...folders, ...files]) {
                promises.push(this.deleteFile(diffs, file, useTrash));
            }
            yield Promise.all(promises);
            this._onDidDeleteFiles.fire(data);
        });
    }
}
function separateFilesAndFolders(file, folders, files) {
    if (file.type === 'folder')
        folders.push(file.path);
    else
        files.push(file.path);
}
function removeSubfiles(folders, files) {
    for (const folder of folders) {
        let i = 0;
        let file;
        while ((file = files[i++])) {
            if (file !== folder && file.startsWith(folder))
                files.splice(--i, 1);
        }
    }
}

class DiffStatusBar {
    constructor(context) {
        this.currentText = '';
        if (!DiffStatusBar.statusBarItem) {
            DiffStatusBar.statusBarItem = vscode__namespace.window.createStatusBarItem(vscode__namespace.StatusBarAlignment.Left);
            DiffStatusBar.statusBarItem.command = 'l13Diff.action.output.show';
            DiffStatusBar.statusBarItem.tooltip = 'Diff Folders Output';
            DiffStatusBar.statusBarItem.show();
            context.subscriptions.push(DiffStatusBar.statusBarItem);
        }
        DiffStatusBar.currentStatusBar = this;
        DiffStatusBar.activeStatusBars.push(this);
        this.update();
    }
    activate() {
        if (DiffStatusBar.currentStatusBar !== this) {
            DiffStatusBar.currentStatusBar = this;
            DiffStatusBar.statusBarItem.text = this.currentText;
        }
    }
    update(text = '') {
        this.currentText = `$(diff) ${text || 'Diff Folders'}`;
        if (DiffStatusBar.currentStatusBar === this)
            DiffStatusBar.statusBarItem.text = this.currentText;
    }
    dispose() {
        remove(DiffStatusBar.activeStatusBars, this);
        if (!DiffStatusBar.activeStatusBars.length && DiffStatusBar.statusBarItem) {
            DiffStatusBar.statusBarItem.dispose();
            DiffStatusBar.statusBarItem = undefined;
        }
    }
}
DiffStatusBar.activeStatusBars = [];

class DetailStats {
    constructor() {
        this.total = 0;
        this.entries = 0;
        this.files = 0;
        this.folders = 0;
        this.symlinks = 0;
        this.errors = 0;
        this.others = 0;
        this.size = 0;
        this.ignoredBOM = 0;
        this.ignoredEOL = 0;
        this.ignoredWhitespace = 0;
    }
}

class FolderStats {
    constructor() {
        this.pathname = '';
        this.entries = 0;
        this.files = 0;
        this.folders = 0;
        this.symlinks = 0;
        this.errors = 0;
        this.others = 0;
        this.size = 0;
    }
}

class DiffStats {
    constructor(result) {
        this.result = result;
        this.pathA = new FolderStats();
        this.pathB = new FolderStats();
        this.all = new DetailStats();
        this.conflicting = new DetailStats();
        this.deleted = new DetailStats();
        this.modified = new DetailStats();
        this.unchanged = new DetailStats();
        this.untracked = new DetailStats();
        this.ignored = new DetailStats();
        this.createStats();
    }
    createStats() {
        const result = this.result;
        this.pathA.pathname = result.pathA;
        this.pathB.pathname = result.pathB;
        result.diffs.forEach((diff) => {
            if (diff.fileA)
                countFileStats(this.pathA, diff.fileA);
            if (diff.fileB)
                countFileStats(this.pathB, diff.fileB);
            countAllStats(this.all, this.pathA, this.pathB);
            if (diff.status === 'conflicting')
                countDetailStats(this.conflicting, diff);
            else if (diff.status === 'deleted')
                countDetailStats(this.deleted, diff);
            else if (diff.status === 'modified')
                countDetailStats(this.modified, diff);
            else if (diff.status === 'unchanged')
                countDetailStats(this.unchanged, diff);
            else if (diff.status === 'untracked')
                countDetailStats(this.untracked, diff);
            else if (diff.status === 'ignored')
                countDetailStats(this.ignored, diff);
        });
    }
    report() {
        const diffs = this.result.diffs;
        const settings = this.result.settings;
        const pathA = this.pathA;
        const pathB = this.pathB;
        return `${DiffStats.formatSettings(settings)}



INFO

Compared:    ${formatFileStats(`${pathA.pathname}" ↔ "${pathB.pathname}`, this.all)}

Left Path:   ${formatFileStats(pathA.pathname, pathA)}

Right Path:  ${formatFileStats(pathB.pathname, pathB)}



RESULT

Comparisons: ${diffs.length - this.ignored.total}
Diffs:       ${diffs.length - this.ignored.total - this.unchanged.total}
Conflicts:   ${this.conflicting.total}
Created:     ${formatTotal(this.untracked)}
Deleted:     ${formatTotal(this.deleted)}
Modified:    ${formatTotal(this.modified)}
Unchanged:   ${formatTotal(this.unchanged)}
Ignored:     ${formatEntries(this.ignored)}



UPDATES
`;
    }
    static formatSettings(settings) {
        return `SETTINGS

Abort on Error: ${settings.abortOnError}
Excludes: "${settings.excludes.join('", "')}"
Ignore Contents: ${settings.ignoreContents}
Ignore End of Line: ${settings.ignoreEndOfLine}
Ignore Byte Order Mark: ${settings.ignoreByteOrderMark}
Ignore Leading/Trailing Whitespace: ${settings.ignoreTrimWhitespace}
Max File Size: ${settings.maxFileSize ? `${settings.maxFileSize} MB` : '0'}
Use Case Sensitive: ${settings.useCaseSensitive}`;
    }
}
function countFileStats(stats, file) {
    stats.entries++;
    if (file.stat)
        stats.size += file.stat.size;
    if (file.type === 'file')
        stats.files++;
    else if (file.type === 'folder')
        stats.folders++;
    else if (file.type === 'symlink')
        stats.symlinks++;
    else if (file.type === 'error')
        stats.errors++;
    else if (file.type === 'unknown')
        stats.others++;
}
function countAllStats(stats, pathA, pathB) {
    stats.entries = pathA.entries + pathB.entries;
    stats.size = pathA.size + pathB.size;
    stats.files = pathA.files + pathB.files;
    stats.folders = pathA.folders + pathB.folders;
    stats.symlinks = pathA.symlinks + pathB.symlinks;
    stats.errors = pathA.errors + pathB.errors;
    stats.others = pathA.others + pathB.others;
}
function countDetailStats(stats, diff) {
    stats.total++;
    if (diff.ignoredEOL)
        stats.ignoredEOL += diff.ignoredEOL === 3 ? 2 : 1;
    if (diff.ignoredBOM)
        stats.ignoredBOM += diff.ignoredBOM === 3 ? 2 : 1;
    if (diff.ignoredWhitespace)
        stats.ignoredWhitespace += diff.ignoredWhitespace === 3 ? 2 : 1;
    if (diff.fileA)
        countFileStats(stats, diff.fileA);
    if (diff.fileB)
        countFileStats(stats, diff.fileB);
}
function formatFileStats(name, stats) {
    return `"${name}"
Entries:     ${formatEntries(stats)}
Size:        ${formatFileSize(stats.size)}`;
}
function formatTotal(stats) {
    const ignored = [];
    if (stats.ignoredBOM)
        ignored.push(`BOM in ${formatAmount(stats.ignoredBOM, pluralFiles)}`);
    if (stats.ignoredEOL)
        ignored.push(`EOL in ${formatAmount(stats.ignoredEOL, pluralFiles)}`);
    if (stats.ignoredWhitespace)
        ignored.push(`Whitespace in ${formatAmount(stats.ignoredWhitespace, pluralFiles)}`);
    const info = ignored.length ? `, Ignored ${formatList(ignored)}` : '';
    const entries = formatDetails(stats);
    return entries.length ? `${stats.total} (${entries.join(', ')})${info}` : '0';
}
function formatEntries(stats) {
    const entries = formatDetails(stats);
    return entries.length > 1 ? `${stats.entries} (${entries.join(', ')})` : entries[0] || '0';
}
function formatDetails(stats) {
    const entries = [];
    if (stats.files)
        entries.push(`${formatAmount(stats.files, pluralFiles)}`);
    if (stats.folders)
        entries.push(`${formatAmount(stats.folders, pluralFolders)}`);
    if (stats.symlinks)
        entries.push(`${formatAmount(stats.symlinks, pluralSymlinks)}`);
    if (stats.errors)
        entries.push(`${formatAmount(stats.errors, pluralErrors)}`);
    if (stats.others)
        entries.push(`${formatAmount(stats.others, pluralOthers)}`);
    return entries;
}

class MenuState {
    static create(context) {
        return MenuState.current || (MenuState.current = new MenuState(context));
    }
    constructor(context) {
        this.context = context;
        this._onDidChangeHistory = new vscode__namespace.EventEmitter();
        this.onDidChangeHistory = this._onDidChangeHistory.event;
    }
    get() {
        return getHistory(this.context);
    }
    save(history) {
        updateHistory(this.context, history);
    }
    saveRecentlyUsed(pathA, pathB) {
        let history = getHistory(this.context);
        history = history.filter((path) => path !== pathA && path !== pathB);
        history.unshift(pathA, pathB);
        history = history.slice(0, maxRecentlyUsed());
        this.save(history);
        this._onDidChangeHistory.fire(history);
    }
    clear() {
        this.save([]);
        this._onDidChangeHistory.fire([]);
    }
}
MenuState.current = null;

const findFileOperator = /\[[!=+-]\]/;
function init$9(currentDiffPanel) {
    const historyState = HistoryState.create(currentDiffPanel.context);
    const menuState = MenuState.create(currentDiffPanel.context);
    currentDiffPanel.msg.on('create:diffs', (data) => {
        currentDiffPanel.compare.initCompare(data);
    });
    currentDiffPanel.compare.onWillCompare(() => {
        currentDiffPanel.status.update();
        currentDiffPanel.output.clear();
        currentDiffPanel.output.msg('LOG\n');
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onDidNotCompare(({ diffSettings, error, pathA, pathB }) => {
        currentDiffPanel.output.log(`${error}`);
        if (error instanceof Error)
            currentDiffPanel.output.msg(`${error.stack}`);
        if (diffSettings)
            currentDiffPanel.output.msg(`\n\n\n${DiffStats.formatSettings(diffSettings)}`);
        currentDiffPanel.msg.send('create:diffs', new DiffResult(pathA, pathB, null));
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onWillCompareFiles(({ data, pathA, pathB }) => {
        historyState.add(pathA, pathB, 'file');
        menuState.saveRecentlyUsed(data.pathA, data.pathB);
        currentDiffPanel.setTitle(pathA, pathB);
        currentDiffPanel.output.log(`Comparing "${pathA}" ↔ "${pathB}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onDidCompareFiles((data) => {
        currentDiffPanel.msg.send('create:diffs', data);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onWillCompareFolders(({ data, pathA, pathB }) => {
        historyState.add(pathA, pathB, 'folder');
        menuState.saveRecentlyUsed(data.pathA, data.pathB);
        currentDiffPanel.setTitle(pathA, pathB);
        currentDiffPanel.output.log(`Start comparing "${pathA}" ↔ "${pathB}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onWillScanFolder((pathname) => {
        currentDiffPanel.output.log(`Scanning "${pathname}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onDidScanFolder((result) => {
        const total = Object.entries(result).length;
        currentDiffPanel.output.log(`Found ${formatAmount(total, pluralEntries)}`);
    }, null, currentDiffPanel.disposables);
    if (currentDiffPanel.context.extensionMode === vscode__namespace.ExtensionMode.Development) {
        currentDiffPanel.compare.onDidCompareFolders((data) => {
            checkResult(data);
        }, null, currentDiffPanel.disposables);
    }
    currentDiffPanel.compare.onDidCompareFolders((data) => {
        currentDiffPanel.output.log('Creating stats for diff result');
        const diffStats = new DiffStats(data);
        const ignoredEntries = diffStats.ignored.entries;
        const comparedEntries = diffStats.all.entries - ignoredEntries;
        let text = `Compared ${formatAmount(comparedEntries, pluralEntries)}`;
        currentDiffPanel.status.update(text);
        if (ignoredEntries)
            text += `, ignored ${formatAmount(ignoredEntries, pluralEntries)}`;
        currentDiffPanel.output.log(`${text}\n\n\n`);
        currentDiffPanel.output.msg(diffStats.report());
        if (!comparedEntries)
            vscode__namespace.window.showInformationMessage('No files or folders to compare.');
        currentDiffPanel.msg.send('create:diffs', data);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.msg.on('compare:multi', () => {
        currentDiffPanel.sendAll('compare:multi');
    });
}
function testStatus(diff, status) {
    if (diff.status !== status) {
        vscode__namespace.window.showErrorMessage(`The result for "${diff.id}" is not "${status}".`);
    }
}
function checkResult(data) {
    data.diffs.forEach((diff) => {
        var _a, _b;
        const basenameA = (_a = diff.fileA) === null || _a === void 0 ? void 0 : _a.basename;
        const basenameB = (_b = diff.fileB) === null || _b === void 0 ? void 0 : _b.basename;
        if (basenameA && findFileOperator.test(basenameA) || basenameB && findFileOperator.test(basenameB)) {
            if (basenameA && basenameB) {
                if (basenameA.includes('[=]') && basenameB.includes('[=]'))
                    testStatus(diff, 'unchanged');
                else if (basenameA.includes('[!]') && basenameB.includes('[!]'))
                    testStatus(diff, 'modified');
                else if (basenameA.includes('[~]') && basenameB.includes('[~]'))
                    testStatus(diff, 'conflicting');
                else
                    vscode__namespace.window.showErrorMessage(`The result for "${diff.id}" does not match the requirements.`);
            }
            else if (basenameA) {
                if (basenameA.includes('[-]'))
                    testStatus(diff, 'deleted');
                else if (basenameA.includes('[+]') || basenameA.includes('[=]') || basenameA.includes('[!]') || basenameA.includes('[~]')) {
                    vscode__namespace.window.showErrorMessage(`The result for "${diff.id}" does not match the requirements.`);
                }
            }
            else if (basenameB) {
                if (basenameB.includes('[+]'))
                    testStatus(diff, 'untracked');
                else if (basenameB.includes('[-]') || basenameB.includes('[=]') || basenameB.includes('[!]') || basenameB.includes('[~]')) {
                    vscode__namespace.window.showErrorMessage(`The result for "${diff.id}" does not match the requirements.`);
                }
            }
        }
    });
}

function init$8(currentDiffPanel) {
    currentDiffPanel.msg.on('context', ({ name, value }) => {
        currentDiffPanel.setContext(name, value);
    });
}

function init$7(currentDiffPanel) {
    currentDiffPanel.msg.on('copy:left', (data) => {
        currentDiffPanel.copy.showCopyFromToDialog(data, 'A', 'B');
    });
    currentDiffPanel.msg.on('copy:right', (data) => {
        currentDiffPanel.copy.showCopyFromToDialog(data, 'B', 'A');
    });
    currentDiffPanel.msg.on('multi-copy:left', (data) => {
        currentDiffPanel.copy.showMultiCopyFromToDialog(data, 'left');
    });
    currentDiffPanel.msg.on('multi-copy:right', (data) => {
        currentDiffPanel.copy.showMultiCopyFromToDialog(data, 'right');
    });
    currentDiffPanel.copy.onDidCancel(() => {
        currentDiffPanel.msg.send('cancel');
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.copy.onDidCopyFile(({ from, to }) => {
        currentDiffPanel.output.log(`Copied ${from.type} "${from.name}" from "${from.root}" to "${to.root}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.copy.onDidCopyFiles(({ data, from }) => {
        currentDiffPanel.msg.send(from === 'A' ? 'copy:left' : 'copy:right', data);
        if (data.multi)
            currentDiffPanel.sendOthers('update:multi', data);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.copy.onInitMultiCopy(({ data, from }) => {
        currentDiffPanel.sendAll(`multi-copy:${from}`, data);
    }, null, currentDiffPanel.disposables);
}

function init$6(currentDiffPanel) {
    currentDiffPanel.msg.on('delete:both', (data) => {
        currentDiffPanel.delete.showDeleteFilesDialog(data);
    });
    currentDiffPanel.msg.on('delete:left', (data) => {
        currentDiffPanel.delete.showDeleteFileDialog(data, 'left');
    });
    currentDiffPanel.msg.on('delete:right', (data) => {
        currentDiffPanel.delete.showDeleteFileDialog(data, 'right');
    });
    currentDiffPanel.delete.onDidCancel(() => {
        currentDiffPanel.msg.send('cancel');
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.delete.onDidDeleteFile((file) => {
        currentDiffPanel.output.log(`Deleted ${file.type} "${file.path}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.delete.onDidDeleteFiles((data) => {
        currentDiffPanel.msg.send('delete:files', data);
        currentDiffPanel.sendOthers('update:multi', data);
    }, null, currentDiffPanel.disposables);
}

function init$5(currentDiffPanel) {
    currentDiffPanel.msg.on('dialog:file', () => __awaiter(this, void 0, void 0, function* () {
        const fsPath = yield openFile$1();
        currentDiffPanel.msg.send('dialog:file', { fsPath });
    }));
    currentDiffPanel.msg.on('dialog:folder', () => __awaiter(this, void 0, void 0, function* () {
        const fsPath = yield openFolder();
        currentDiffPanel.msg.send('dialog:folder', { fsPath });
    }));
}

function init$4(currentDiffPanel) {
    const favoritesState = FavoritesState.create(currentDiffPanel.context);
    const favoritesDialog = FavoritesDialog.create(favoritesState);
    currentDiffPanel.msg.on('save:favorite', (data) => {
        favoritesDialog.add(data.pathA, data.pathB);
    });
}

function init$3(currentDiffPanel) {
    const menuState = MenuState.create(currentDiffPanel.context);
    currentDiffPanel.msg.on('update:menu', () => {
        currentDiffPanel.msg.send('update:menu', {
            history: menuState.get(),
            workspaces: workspacePaths(vscode__namespace.workspace.workspaceFolders),
        });
    });
}

const findTimestamp = /\?ts=\d+$/;
class SymlinkContentProvider {
    provideTextDocumentContent(uri, cancel) {
        if (cancel.isCancellationRequested)
            return Promise.resolve('');
        return new Promise((resolve, reject) => {
            fs__namespace.readlink(uri.fsPath.replace(findTimestamp, ''), (error, content) => {
                if (error)
                    reject(error);
                else
                    resolve(content);
            });
        });
    }
    static parse(pathname) {
        return vscode__namespace.Uri.parse(`${SymlinkContentProvider.SCHEME}:${pathname}?ts=${+new Date()}`, true);
    }
}
SymlinkContentProvider.SCHEME = 'l13diffsymlink';

class DiffOpen {
    static openFile(fsPathOrFile, openToSide, preview) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fsPath = typeof fsPathOrFile === 'string' ? fsPathOrFile : fsPathOrFile.fsPath;
                const stat = yield lstat(fsPath);
                if (stat.isFile())
                    yield openFile(vscode__namespace.Uri.file(fsPath), openToSide, preview);
                else if (stat.isDirectory())
                    void 0;
                else if (stat.isSymbolicLink())
                    yield openFile(SymlinkContentProvider.parse(fsPath), openToSide, preview);
                else
                    vscode__namespace.window.showErrorMessage(`File can't be opened. "${fsPath}" is not a file.`);
            }
            catch (error) {
                vscode__namespace.window.showErrorMessage(formatError(error));
            }
        });
    }
    static openDiff(diff, openToSide, preview) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fileA = diff.fileA;
                const fileB = diff.fileB;
                const statA = yield lstat(fileA.fsPath);
                const statB = yield lstat(fileB.fsPath);
                if (statA.isFile() && statB.isFile()) {
                    const left = vscode__namespace.Uri.file(fileA.fsPath);
                    const right = vscode__namespace.Uri.file(fileB.fsPath);
                    const title = formatLabel(fileA, fileB);
                    yield openDiff(left, right, title, openToSide, preview);
                }
                else if (statA.isDirectory() && statB.isDirectory()) {
                    if (!preview) {
                        const left = vscode__namespace.Uri.file(fileA.fsPath);
                        const right = vscode__namespace.Uri.file(fileB.fsPath);
                        yield vscode__namespace.commands.executeCommand('l13Diff.action.panel.openAndCompare', left, right, true, openToSide);
                    }
                }
                else if (statA.isSymbolicLink() && statB.isSymbolicLink()) {
                    const left = SymlinkContentProvider.parse(fileA.fsPath);
                    const right = SymlinkContentProvider.parse(fileB.fsPath);
                    const title = formatLabel(fileA, fileB);
                    yield openDiff(left, right, title, openToSide, preview);
                }
            }
            catch (error) {
                vscode__namespace.window.showErrorMessage(formatError(error));
            }
        });
    }
    static open(diff, openToSide, preview = false) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (diff.status) {
                case 'deleted':
                case 'untracked':
                    yield DiffOpen.openFile(diff.fileA || diff.fileB, openToSide, preview);
                    break;
                case 'modified':
                case 'unchanged':
                    yield DiffOpen.openDiff(diff, openToSide, preview);
                    break;
                case 'ignored':
                    if (diff.fileA && diff.fileB)
                        yield DiffOpen.openDiff(diff, openToSide, preview);
                    else
                        yield DiffOpen.openFile(diff.fileA || diff.fileB, openToSide, preview);
                    break;
            }
        });
    }
}
function formatLabel(fileA, fileB) {
    const labelFormat = get('labelFormat', 'complete');
    if (fileA.name !== fileB.name) {
        switch (labelFormat) {
            case 'complete':
            case 'compact': {
                const [name, root] = formatNameAndDesc(fileA.fsPath, fileB.fsPath);
                return labelFormat === 'complete' && root ? `${name} (${root})` : name;
            }
            case 'relative':
                return formatName(fileA.name, fileB.name);
        }
        return formatName(fileA.fsPath, fileB.fsPath);
    }
    switch (labelFormat) {
        case 'complete':
            return `${fileA.name} (${formatName(fileA.root, fileB.root)})`;
        case 'compact': {
            const [name] = formatNameAndDesc(fileA.root, fileB.root);
            return `${fileA.name} (${name})`;
        }
        case 'relative':
            return fileA.name;
    }
    return path.basename(fileA.name);
}
function openDiff(left, right, title, openToSide, preview) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode__namespace.commands.executeCommand('vscode.diff', left, right, title, {
            preview,
            preserveFocus: preview,
            viewColumn: openToSide ? vscode__namespace.ViewColumn.Beside : vscode__namespace.ViewColumn.Active,
        });
    });
}
function openFile(uri, openToSide, preview) {
    return __awaiter(this, void 0, void 0, function* () {
        yield vscode__namespace.commands.executeCommand('vscode.open', uri, {
            preview,
            preserveFocus: preview,
            viewColumn: openToSide ? vscode__namespace.ViewColumn.Beside : vscode__namespace.ViewColumn.Active,
        });
    });
}

function init$2(currentDiffPanel) {
    currentDiffPanel.msg.on('open:diff', ({ diffs, openToSide }) => __awaiter(this, void 0, void 0, function* () {
        openToSide = get('openToSide', false) || openToSide;
        for (let i = 0; i < diffs.length; i++)
            yield DiffOpen.open(diffs[i], i === 0 && openToSide);
    }));
    currentDiffPanel.msg.on('preview:diff', ({ diff }) => __awaiter(this, void 0, void 0, function* () {
        yield DiffOpen.open(diff, true, true);
    }));
    currentDiffPanel.msg.on('goto:file', ({ files: diffFiles, openToSide }) => __awaiter(this, void 0, void 0, function* () {
        openToSide = get('openToSide', false) || openToSide;
        for (let i = 0; i < diffFiles.length; i++)
            yield DiffOpen.openFile(diffFiles[i], i === 0 && openToSide, false);
    }));
    currentDiffPanel.msg.on('reveal:file', (fsPath) => reveal(fsPath));
}

function init$1(currentDiffPanel) {
    currentDiffPanel.msg.on('save:panelstate', (data) => {
        currentDiffPanel.savePanelState(data);
    });
}

function init(currentDiffPanel) {
    currentDiffPanel.msg.on('update:diffs', (data) => {
        currentDiffPanel.compare.updateDiffs(data);
    });
    currentDiffPanel.compare.onDidUpdateDiff((diff) => {
        currentDiffPanel.output.log(`Compared "${formatPath(diff)}" again. Status is now "${diff.status}"`);
    }, null, currentDiffPanel.disposables);
    currentDiffPanel.compare.onDidUpdateAllDiffs((diffResult) => {
        currentDiffPanel.msg.send('update:diffs', diffResult);
    }, null, currentDiffPanel.disposables);
}
function formatPath(diff) {
    const relativeA = diff.fileA.relative;
    const relativeB = diff.fileB.relative;
    return relativeA === relativeB ? relativeA : `${relativeA}" and "${relativeB}`;
}

var _a;
const LISTENERS = Symbol.for('listeners');
class DiffMessage {
    constructor(panel, disposables) {
        this.panel = panel;
        this[_a] = Object.create(null);
        panel.webview.onDidReceiveMessage((message) => {
            const command = message.command;
            const data = message.data;
            const listeners = this[LISTENERS][command];
            if (listeners)
                listeners.forEach((listener) => listener(data));
        }, null, disposables);
    }
    on(name, listener) {
        const listeners = this[LISTENERS][name] || (this[LISTENERS][name] = []);
        listeners[listeners.length] = listener;
    }
    send(command, data = null) {
        this.panel.webview.postMessage({ command, data });
    }
    removeMessageListener(name, listener) {
        if (!listener)
            delete this[LISTENERS][name];
        const listeners = this[LISTENERS][name] || null;
        if (listeners) {
            remove(listeners, listener);
            if (!listeners.length)
                delete this[LISTENERS][name];
        }
    }
    dispose() {
        const listeners = this[LISTENERS];
        for (const name in listeners)
            delete listeners[name];
    }
}
_a = LISTENERS;

const { floor, random } = Math;
const PANEL_STATE = 'panelState';
const platform = isMacOs ? 'mac' : isWindows ? 'win' : 'linux';
let language = vscode__namespace.env.language;
if (!/^[a-z]{2,3}(-[A-Z]{2,3})?$/.test(language))
    language = 'en';
class DiffPanel {
    constructor(panel, context, uris = null, compare) {
        this.contextStates = {};
        this.disposed = false;
        this.disposables = [];
        this._onDidInit = new vscode__namespace.EventEmitter();
        this.onDidInit = this._onDidInit.event;
        this.panel = panel;
        this.context = context;
        this.msg = new DiffMessage(panel, this.disposables);
        this.status = new DiffStatusBar(context);
        this.output = new DiffOutput();
        this.copy = new DiffCopy();
        this.delete = new DiffDelete();
        this.compare = new DiffCompare();
        this.disposables.push(this.msg);
        this.disposables.push(this.output);
        this.disposables.push(this.status);
        init$9(this);
        init$8(this);
        init$7(this);
        init$6(this);
        init$5(this);
        init$4(this);
        init$3(this);
        init$2(this);
        init$1(this);
        init(this);
        this.msg.on('init:view', () => {
            this.msg.send('init:view', {
                panel: this.getPanelState(),
                uris: mapUris(uris),
                workspaces: workspacePaths(vscode__namespace.workspace.workspaceFolders),
                compare,
            });
            this.msg.removeMessageListener('init:view');
            this._onDidInit.fire(undefined);
        });
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.onDidChangeViewState(({ webviewPanel }) => {
            this.setContextFocus(webviewPanel.active);
            if (webviewPanel.active) {
                DiffPanel.currentPanel = this;
                this.status.activate();
                this.output.activate();
                for (const name in this.contextStates)
                    this.setContext(name, this.contextStates[name]);
            }
            else {
                for (const name in this.contextStates)
                    this.setContext(name, false);
            }
        }, null, this.disposables);
        this.panel.webview.html = getHTMLforDiffPanel(this.context, this.panel.webview);
        this.setTitle();
        this.setContextFocus(true);
    }
    dispose() {
        const currentPanels = DiffPanel.currentPanels;
        remove(currentPanels, this);
        this.panel.dispose();
        this.disposed = true;
        while (this.disposables.length) {
            const disposable = this.disposables.pop();
            if (disposable)
                disposable.dispose();
        }
        if (this === DiffPanel.currentPanel) {
            for (const name in this.contextStates)
                this.setContext(name, false);
        }
        DiffPanel.currentPanel = currentPanels[currentPanels.length - 1];
        for (const diffPanel of currentPanels) {
            if (diffPanel.panel.active) {
                DiffPanel.currentPanel = diffPanel;
                break;
            }
        }
        if (DiffPanel.currentPanel) {
            DiffPanel.currentPanel.status.activate();
            DiffPanel.currentPanel.output.activate();
            if (DiffPanel.currentPanel.panel.active) {
                this.setContextFocus(true);
                for (const name in this.contextStates)
                    this.setContext(name, this.contextStates[name]);
            }
        }
        else
            this.setContextFocus(false);
    }
    setTitle(pathA, pathB) {
        const labelFormat = get('labelFormat');
        let title = 'Diff Folders';
        if (pathA && pathB) {
            if (labelFormat !== 'filename') {
                const [label, desc] = formatNameAndDesc(pathA, pathB);
                title = desc && labelFormat === 'complete' ? `${label} (${desc})` : label;
            }
            else
                title = formatName(pathA, pathB);
        }
        this.panel.title = title;
    }
    getPanelState() {
        return this.context.globalState.get(PANEL_STATE);
    }
    savePanelState(data) {
        this.context.globalState.update(PANEL_STATE, data);
    }
    setContext(name, value) {
        this.contextStates[name] = value;
        vscode__namespace.commands.executeCommand('setContext', name, value);
    }
    setContextFocus(value) {
        vscode__namespace.commands.executeCommand('setContext', 'l13DiffFocus', value);
        if (!this.disposed)
            this.msg.send('focus', value);
    }
    send(name, data) {
        this.msg.send(name, data);
    }
    sendAll(name, data) {
        DiffPanel.sendAll(name, data);
    }
    sendOthers(name, data) {
        DiffPanel.currentPanels.forEach((diffPanel) => {
            if (diffPanel !== this)
                diffPanel.send(name, data);
        });
    }
    static create(context, uris = null, compare, openToSide) {
        return __awaiter(this, void 0, void 0, function* () {
            const mediaPath = path__namespace.join(context.extensionPath, 'media');
            const iconsPath = path__namespace.join(mediaPath, 'icons');
            const panel = vscode__namespace.window.createWebviewPanel(DiffPanel.viewType, 'Diff Folders', {
                viewColumn: openToSide ? vscode__namespace.ViewColumn.Beside : vscode__namespace.ViewColumn.Active,
            }, {
                enableScripts: true,
                localResourceRoots: [
                    vscode__namespace.Uri.file(mediaPath),
                ],
                retainContextWhenHidden: true,
            });
            panel.iconPath = {
                dark: vscode__namespace.Uri.file(path__namespace.join(iconsPath, 'icon-dark.svg')),
                light: vscode__namespace.Uri.file(path__namespace.join(iconsPath, 'icon-light.svg')),
            };
            const diffPanel = new DiffPanel(panel, context, uris, compare);
            DiffPanel.currentPanel = diffPanel;
            DiffPanel.currentPanels.push(diffPanel);
            return new Promise((resolve) => {
                diffPanel.onDidInit(() => resolve(undefined), null, diffPanel.disposables);
                diffPanel.msg.on('error:init', ({ error }) => __awaiter(this, void 0, void 0, function* () {
                    const tryAgain = yield vscode__namespace.window.showErrorMessage(error, 'Try Again');
                    diffPanel.dispose();
                    resolve(tryAgain ? DiffPanel.create(context, uris, compare) : undefined);
                }));
            });
        });
    }
    static createOrShow(context, uris = null, compare) {
        if (DiffPanel.currentPanel) {
            DiffPanel.currentPanel.panel.reveal();
            if (uris) {
                DiffPanel.currentPanel.send('update:paths', {
                    uris: mapUris(uris),
                    compare,
                });
            }
            return;
        }
        DiffPanel.create(context, uris, compare);
    }
    static revive(panel, context) {
        const diffPanel = new DiffPanel(panel, context);
        DiffPanel.currentPanel = diffPanel;
        DiffPanel.currentPanels.push(diffPanel);
    }
    static send(name, data) {
        var _a;
        (_a = DiffPanel.currentPanel) === null || _a === void 0 ? void 0 : _a.send(name, data);
    }
    static sendAll(name, data) {
        DiffPanel.currentPanels.forEach((diffPanel) => diffPanel.send(name, data));
    }
}
DiffPanel.currentPanels = [];
DiffPanel.viewType = 'l13DiffPanel';
function nonce() {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = possible.length;
    let text = '';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(floor(random() * length));
    }
    return text;
}
function getHTMLforDiffPanel(context, webview) {
    const mediaPath = path__namespace.join(context.extensionPath, 'media');
    const scriptUri = vscode__namespace.Uri.file(path__namespace.join(mediaPath, 'main.js'));
    const styleUri = vscode__namespace.Uri.file(path__namespace.join(mediaPath, 'style.css'));
    const nonceToken = nonce();
    const csp = `default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonceToken}';`;
    return `<!DOCTYPE html>
<html lang="${language}">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="Content-Security-Policy" content="${csp}">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Diff Folders</title>
		<script nonce="${nonceToken}">
			window.l13Settings = {
				enablePreview: ${!!get('enablePreview', false)},
			};
		</script>
		<script nonce="${nonceToken}">
			window.l13TimeoutId = setTimeout(() => {
				
				acquireVsCodeApi().postMessage({
					command: 'error:init',
					data: { error: 'Failed to load resources!' },
				});
				
			}, 1000);
		</script>
		<link rel="stylesheet" nonce="${nonceToken}" href="${webview.asWebviewUri(styleUri)}">
		<script nonce="${nonceToken}" src="${webview.asWebviewUri(scriptUri)}"></script>
	</head>
	<body class="platform-${platform} language-${language}"></body>
</html>`;
}
function mapUris(uris) {
    return (uris || []).map((uri) => ({ fsPath: uri.fsPath }));
}

function activate$8(context) {
    const subscriptions = context.subscriptions;
    const favoritesState = FavoritesState.create(context);
    const favoriteGroupsState = FavoriteGroupsState.create(context);
    const favoritesDialog = FavoritesDialog.create(favoritesState);
    const favoriteGroupsDialog = FavoriteGroupsDialog.create(favoriteGroupsState, favoritesState);
    const favoritesProvider = FavoritesProvider.create({
        favorites: favoritesState.get(),
        favoriteGroups: favoriteGroupsState.get(),
    });
    const treeView = vscode__namespace.window.createTreeView('l13DiffFavorites', {
        treeDataProvider: favoritesProvider,
        showCollapseAll: true,
    });
    subscriptions.push(treeView.onDidCollapseElement(({ element }) => {
        favoriteGroupsState.saveCollapseState(element.favoriteGroup, true);
    }));
    subscriptions.push(treeView.onDidExpandElement(({ element }) => {
        favoriteGroupsState.saveCollapseState(element.favoriteGroup, false);
    }));
    subscriptions.push(treeView);
    subscriptions.push(favoritesState.onDidChangeFavorites((favorites) => {
        favoritesProvider.refresh({
            favorites,
            favoriteGroups: favoriteGroupsState.get(),
        });
    }));
    subscriptions.push(favoriteGroupsState.onDidChangeFavoriteGroups((favoriteGroups) => {
        favoritesProvider.refresh({
            favorites: favoritesState.get(),
            favoriteGroups,
        });
    }));
    register(context, {
        'l13Diff.action.favorite.compare': ({ favorite }) => {
            openFavorite(context, favorite, openInNewPanel());
        },
        'l13Diff.action.favorite.compareInCurrentPanel': ({ favorite }) => {
            openFavorite(context, favorite, false);
        },
        'l13Diff.action.favorite.compareInNewPanel': ({ favorite }) => {
            openFavorite(context, favorite, true);
        },
        'l13Diff.action.favorite.rename': ({ favorite }) => favoritesDialog.rename(favorite),
        'l13Diff.action.favorite.remove': ({ favorite }) => favoritesDialog.remove(favorite),
        'l13Diff.action.favoriteGroups.add': () => favoriteGroupsDialog.add(),
        'l13Diff.action.favoriteGroups.compareAll': ({ favoriteGroup }) => __awaiter(this, void 0, void 0, function* () {
            const favorites = yield favoriteGroupsDialog.openMultipleDiffPanels(favoriteGroup);
            if (favorites)
                openFavorites(context, favorites);
        }),
        'l13Diff.action.favoriteGroups.compareAllSideBySide': ({ favoriteGroup }) => __awaiter(this, void 0, void 0, function* () {
            const favorites = yield favoriteGroupsDialog.openMultipleDiffPanels(favoriteGroup);
            if (favorites)
                openFavorites(context, favorites, true);
        }),
        'l13Diff.action.favorite.addToGroup': ({ favorite }) => favoriteGroupsDialog.addFavoriteToGroup(favorite),
        'l13Diff.action.favorite.removeFromGroup': ({ favorite }) => favoritesState.removeFavoriteFromGroup(favorite),
        'l13Diff.action.favorite.copyLeftPath': ({ favorite }) => vscode__namespace.env.clipboard.writeText(favorite.fileA),
        'l13Diff.action.favorite.copyRightPath': ({ favorite }) => vscode__namespace.env.clipboard.writeText(favorite.fileB),
        'l13Diff.action.favoriteGroups.rename': ({ favoriteGroup }) => favoriteGroupsDialog.rename(favoriteGroup),
        'l13Diff.action.favoriteGroups.remove': ({ favoriteGroup }) => favoriteGroupsDialog.remove(favoriteGroup),
        'l13Diff.action.favorites.export': () => favoriteGroupsDialog.export(),
        'l13Diff.action.favorites.import': () => favoriteGroupsDialog.import(),
        'l13Diff.action.favorites.clear': () => favoritesDialog.clear(),
    });
}
function openFavorite(context, favorite, openInNewPanel) {
    if (openInNewPanel)
        DiffPanel.create(context, [{ fsPath: favorite.fileA }, { fsPath: favorite.fileB }], true);
    else
        DiffPanel.createOrShow(context, [{ fsPath: favorite.fileA }, { fsPath: favorite.fileB }], true);
}
function openFavorites(context, favorites, sideBySide) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const favorite of favorites) {
            yield DiffPanel.create(context, [{ fsPath: favorite.fileA }, { fsPath: favorite.fileB }], true, sideBySide);
        }
    });
}

class HistoryDialog {
    static create(historyState, menuState) {
        return HistoryDialog.current || (HistoryDialog.current = new HistoryDialog(historyState, menuState));
    }
    constructor(historyState, menuState) {
        this.historyState = historyState;
        this.menuState = menuState;
    }
    remove(comparison) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = `Delete comparison '${`${comparison.label}${comparison.desc ? ` (${comparison.desc})` : ''}`}'?`;
            if (yield confirm(text, 'Delete')) {
                this.historyState.remove(comparison);
            }
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield confirm('Delete the complete history?', 'Delete')) {
                this.menuState.clear();
                this.historyState.clear();
            }
        });
    }
}
HistoryDialog.current = null;

function activate$7(context) {
    const subscriptions = context.subscriptions;
    const favoritesState = FavoritesState.create(context);
    const historyState = HistoryState.create(context);
    const menuState = MenuState.create(context);
    const favoritesDialog = FavoritesDialog.create(favoritesState);
    const historyDialog = HistoryDialog.create(historyState, menuState);
    const historyProvider = HistoryProvider.create({
        comparisons: historyState.get(),
    });
    vscode__namespace.window.registerTreeDataProvider('l13DiffHistory', historyProvider);
    subscriptions.push(historyState.onDidChangeComparisons((comparisons) => {
        historyProvider.refresh({
            comparisons,
        });
    }));
    register(context, {
        'l13Diff.action.history.compare': ({ comparison }) => openComparison(context, comparison, openInNewPanel(), historyState),
        'l13Diff.action.history.compareInCurrentPanel': ({ comparison }) => openComparison(context, comparison, false, historyState),
        'l13Diff.action.history.compareInNewPanel': ({ comparison }) => openComparison(context, comparison, true, historyState),
        'l13Diff.action.history.addToFavorites': ({ comparison }) => {
            favoritesDialog.add(comparison.fileA, comparison.fileB);
        },
        'l13Diff.action.history.copyLeftPath': ({ comparison }) => vscode__namespace.env.clipboard.writeText(comparison.fileA),
        'l13Diff.action.history.copyRightPath': ({ comparison }) => vscode__namespace.env.clipboard.writeText(comparison.fileB),
        'l13Diff.action.history.remove': ({ comparison }) => historyDialog.remove(comparison),
        'l13Diff.action.history.clear': () => __awaiter(this, void 0, void 0, function* () { return historyDialog.clear(); }),
    });
}
function openComparison(context, comparison, openInNewPanel, historyState) {
    if (comparison.type === 'file') {
        const left = vscode__namespace.Uri.file(comparison.fileA);
        const right = vscode__namespace.Uri.file(comparison.fileB);
        const openToSide = get('openToSide', false);
        vscode__namespace.commands.executeCommand('vscode.diff', left, right, undefined, {
            preview: false,
            viewColumn: openToSide ? vscode__namespace.ViewColumn.Beside : vscode__namespace.ViewColumn.Active,
        });
        historyState.add(comparison.fileA, comparison.fileB, 'file');
        return;
    }
    if (openInNewPanel)
        DiffPanel.create(context, [{ fsPath: comparison.fileA }, { fsPath: comparison.fileB }], true);
    else
        DiffPanel.createOrShow(context, [{ fsPath: comparison.fileA }, { fsPath: comparison.fileB }], true);
}

function activate$6(context) {
    register(context, {
        'l13Diff.action.output.show': () => { var _a; return (_a = DiffOutput.currentOutput) === null || _a === void 0 ? void 0 : _a.show(); },
    });
}

let updateFiles = [];
let timeoutId = null;
function activate$5(context) {
    register(context, {
        'l13Diff.action.panel.open': () => DiffPanel.create(context),
        'l13Diff.action.panel.openAndCompare': (left, right, newPanel, openToSide) => {
            if (newPanel)
                DiffPanel.create(context, [left, right], true, openToSide);
            else
                DiffPanel.createOrShow(context, [left, right], true);
        },
    });
    if (vscode__namespace.window.registerWebviewPanelSerializer) {
        vscode__namespace.window.registerWebviewPanelSerializer(DiffPanel.viewType, {
            deserializeWebviewPanel(webviewPanel) {
                return __awaiter(this, void 0, void 0, function* () {
                    DiffPanel.revive(webviewPanel, context);
                });
            },
        });
    }
    context.subscriptions.push(vscode__namespace.workspace.onDidSaveTextDocument(({ fileName }) => {
        if (fileName && DiffPanel.currentPanel) {
            if (timeoutId !== null)
                clearTimeout(timeoutId);
            updateFiles.push(fileName);
            timeoutId = setTimeout(sendUpdateFiles, 200);
        }
    }));
    context.subscriptions.push(vscode__namespace.workspace.onDidDeleteFiles(({ files }) => {
        if (files.length && DiffPanel.currentPanel) {
            const fsPaths = files.map((uri) => uri.fsPath);
            DiffPanel.sendAll('remove:files', { files: fsPaths });
        }
    }));
    context.subscriptions.push(vscode__namespace.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('l13Diff.enablePreview')) {
            DiffPanel.sendAll('change:settings', {
                enablePreview: !!get('enablePreview'),
            });
        }
    }));
}
function sendUpdateFiles() {
    DiffPanel.sendAll('update:files', { files: updateFiles });
    updateFiles = [];
    timeoutId = null;
}

function activate$4(context) {
    register(context, {
        'l13Diff.action.projects.compareWithWorkspace': ({ project }) => __awaiter(this, void 0, void 0, function* () {
            const workspaces = workspaceFoldersQuickPickItems();
            if (workspaces.length > 1) {
                const value = yield vscode__namespace.window.showQuickPick(workspaces);
                if (value)
                    DiffPanel.createOrShow(context, [{ fsPath: value.description }, { fsPath: project.path }], true);
            }
            else if (workspaces.length === 1) {
                DiffPanel.createOrShow(context, [{ fsPath: workspaces[0].description }, { fsPath: project.path }], true);
            }
            else
                vscode__namespace.window.showErrorMessage('No workspace available!');
        }),
        'l13Diff.action.projects.open': ({ project }) => {
            DiffPanel.createOrShow(context, [{ fsPath: project.path }, { fsPath: '' }]);
        },
    });
}
function workspaceFoldersQuickPickItems() {
    const workspaceFolders = vscode__namespace.workspace.workspaceFolders;
    return workspaceFolders ? workspaceFolders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath })) : [];
}

function activate$3(context) {
    buildWhitelistForTextFiles();
    context.subscriptions.push(vscode__namespace.extensions.onDidChange(() => buildWhitelistForTextFiles()));
    context.subscriptions.push(vscode__namespace.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('files.associations'))
            buildWhitelistForTextFiles();
    }));
    register(context, {
        'l13Diff.action.settings.compareWhitespace': () => {
            const useDefault = get('ignoreTrimWhitespace', 'default');
            if (useDefault === 'default')
                vscode__namespace.workspace.getConfiguration('diffEditor').update('ignoreTrimWhitespace', false, true);
            else
                update('ignoreTrimWhitespace', 'off');
        },
        'l13Diff.action.settings.ignoreWhitespace': () => {
            const useDefault = get('ignoreTrimWhitespace', 'default');
            if (useDefault === 'default')
                vscode__namespace.workspace.getConfiguration('diffEditor').update('ignoreTrimWhitespace', true, true);
            else
                update('ignoreTrimWhitespace', 'on');
        },
        'l13Diff.action.settings.compareEndOfLine': () => update('ignoreEndOfLine', false),
        'l13Diff.action.settings.ignoreEndOfLine': () => update('ignoreEndOfLine', true),
        'l13Diff.action.settings.useCaseSensitive': () => update('useCaseSensitiveFileName', 'on'),
        'l13Diff.action.settings.ignoreCaseSensitive': () => update('useCaseSensitiveFileName', 'off'),
    });
}

function activate$2(context) {
    register(context, createDiffPanelLinks([
        'l13Diff.action.panel.addToFavorites',
        'l13Diff.action.panel.compare',
        'l13Diff.action.panel.compareAll',
        'l13Diff.action.inputs.swap',
        'l13Diff.action.inputs.swapAll',
        'l13Diff.action.input.pickLeftFolder',
        'l13Diff.action.input.pickLeftFile',
        'l13Diff.action.input.pickRightFolder',
        'l13Diff.action.input.pickRightFile',
        'l13Diff.action.actions.copyToLeftFolder',
        'l13Diff.action.actions.copyToRightFolder',
        'l13Diff.action.actions.selectAllEntries',
        'l13Diff.action.actions.selectCreatedEntries',
        'l13Diff.action.actions.selectDeletedEntries',
        'l13Diff.action.actions.selectModifiedEntries',
        'l13Diff.action.list.delete',
        'l13Diff.action.list.unselect',
        'l13Diff.action.menu.close',
        'l13Diff.action.search.open',
        'l13Diff.action.search.close',
        'l13Diff.action.search.toggleFindCaseSensitive',
        'l13Diff.action.search.toggleFindConflicts',
        'l13Diff.action.search.toggleFindFiles',
        'l13Diff.action.search.toggleFindFolders',
        'l13Diff.action.search.toggleFindOthers',
        'l13Diff.action.search.toggleFindRegularExpression',
        'l13Diff.action.search.toggleFindSymbolicLinks',
        'l13Diff.action.views.toggleShowAllCreated',
        'l13Diff.action.views.toggleShowAllDeleted',
        'l13Diff.action.views.toggleShowAllIgnored',
        'l13Diff.action.views.toggleShowAllModified',
        'l13Diff.action.views.toggleShowAllUnchanged',
    ]));
}
function createDiffPanelLinks(diffPanelCommands) {
    const map = {};
    diffPanelCommands.forEach((command) => {
        map[command] = () => DiffPanel.send(command);
    });
    return map;
}

function activate$1(context) {
    const contentProvider = new SymlinkContentProvider();
    context.subscriptions.push(vscode__namespace.workspace.registerTextDocumentContentProvider(SymlinkContentProvider.SCHEME, contentProvider));
}

function activate(context) {
    activate$b(context);
    activate$9(context);
    activate$8(context);
    activate$7(context);
    activate$6(context);
    activate$5(context);
    activate$4(context);
    activate$3(context);
    activate$2(context);
    activate$1(context);
    if (context.extensionMode === vscode__namespace.ExtensionMode.Development)
        activate$a(context);
}
function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;
