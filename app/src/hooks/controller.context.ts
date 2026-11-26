import { createContext } from 'react';
import { ControllerStore } from './controller.store';

export const ControllerStoreContext = createContext<ControllerStore | null>(null);
