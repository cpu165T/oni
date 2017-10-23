/**
 * Menu.ts
 *
 * Implements API surface area for working with the status bar
 */

import { applyMiddleware, bindActionCreators, createStore } from "redux"
import thunk from "redux-thunk"

import { Event, IEvent } from "./../../Event"

import * as ActionCreators from "./../Menu/MenuActionCreators"
import { reducer } from "./../Menu/MenuReducer"
import * as State from "./../Menu/MenuState"

export const contextMenuStore = createStore(reducer, State.createDefaultState(), applyMiddleware(thunk))
export const contextMenuActions: typeof ActionCreators = bindActionCreators(ActionCreators as any, contextMenuStore.dispatch)

// TODO: This is essentially a duplicate of `MenuManager.ts` - can this be consolidated?
// Can potentially move to a higher-order class that takes contextMenuActions/store as arguments

export class ContextMenuManager {
    private _id: number = 0

    public create(): ContextMenu {
        this._id++
        return new ContextMenu(this._id.toString())
    }

    public isMenuOpen(): boolean {
        return !!contextMenuStore.getState().menu
    }

    public nextMenuItem(): void {
        contextMenuActions.nextMenuItem()
    }

    public previousMenuItem(): void {
        contextMenuActions.previousMenuItem()
    }

    public closeActiveMenu(): void {
        contextMenuActions.hidePopupMenu()
    }

    public selectMenuItem(idx?: number): void {
        const contextMenuState = contextMenuStore.getState()

        if (contextMenuState && contextMenuState.menu) {
            contextMenuState.menu.onSelectItem(idx)
        }
    }
}

export class ContextMenu {
    private _onItemSelected = new Event<any>()
    private _onFilterTextChanged = new Event<string>()
    private _onHide = new Event<void>()

    public get onHide(): IEvent<void> {
        return this._onHide
    }

    public get onItemSelected(): IEvent<any> {
        return this._onItemSelected
    }

    public get onFilterTextChanged(): IEvent<string> {
        return this._onFilterTextChanged
    }

    public get selectedItem() {
        return this._getSelectedItem()
    }

    constructor(private _id: string) {
    }

    public isOpen(): boolean {
        const contextMenuState = contextMenuStore.getState()
        return contextMenuState.menu && contextMenuState.menu.id === this._id
    }

    public setLoading(isLoading: boolean): void {
        contextMenuActions.setMenuLoading(this._id, isLoading)
    }

    public setItems(items: Oni.Menu.MenuOption[]): void {
        contextMenuActions.setMenuItems(this._id, items)
    }

    public show(): void {
        contextMenuActions.showPopupMenu(this._id, {
            onSelectItem: (idx: number) => this._onItemSelectedHandler(idx),
            onHide: () => this._onHide.dispatch(),
            onFilterTextChanged: (newText) => this._onFilterTextChanged.dispatch(newText),
        })
    }

    public hide(): void {
        contextMenuActions.hidePopupMenu()
    }

    private _onItemSelectedHandler(idx?: number): void {

        const selectedOption = this._getSelectedItem(idx)
        this._onItemSelected.dispatch(selectedOption)

        this.hide()
    }

    private _getSelectedItem(idx?: number) {
        const contextMenuState = contextMenuStore.getState()

        if (!contextMenuState.menu) {
            return null
        }

        const index = (typeof idx === "number") ? idx : contextMenuState.menu.selectedIndex

        return contextMenuState.menu.filteredOptions[index]
    }
}

export const contextMenuManager = new ContextMenuManager()
