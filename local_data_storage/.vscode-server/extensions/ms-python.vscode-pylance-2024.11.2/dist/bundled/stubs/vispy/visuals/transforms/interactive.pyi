import numpy as np
from vispy.app.canvas import Canvas
from vispy.util.event import Event

from .linear import STTransform

# -*- coding: utf-8 -*-
# Copyright (c) Vispy Development Team. All Rights Reserved.
# Distributed under the (new) BSD License. See LICENSE.txt for more info.

class PanZoomTransform(STTransform):
    def __init__(self, canvas: None | Canvas = None, aspect: None | float = None, **kwargs): ...
    def attach(self, canvas: Canvas): ...
    @property
    def canvas_tr(self): ...
    def on_resize(self, event: Event): ...
    def on_mouse_move(self, event: Event): ...
    def on_mouse_wheel(self, event: Event): ...