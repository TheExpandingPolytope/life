from deps import Dim, Grid
from collections import defaultdict

default_address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"

init_grid = Grid(Dim(50, 50), {(22, 8), (12, 7), (36, 7), (17, 9), (11, 8), (1, 9), (25, 4), (2, 8), (16, 7),
                                   (25, 10), (21, 6), (23, 9), (14, 6), (36, 6), (22, 7), (14, 12), (17, 8), (11, 10),
                                   (25, 9), (35, 7), (1, 8), (18, 9), (22, 6), (21, 8), (23, 5), (12, 11), (17, 10),
                                   (11, 9), (35, 6), (25, 5), (2, 9), (13, 6), (13, 12), (15, 9), (16, 11), (21, 7)})

def set_owners():
    init_owners = defaultdict(str)
    global init_grid
    for pos in init_grid.cells:
        init_owners[pos] = default_address
    return init_owners
