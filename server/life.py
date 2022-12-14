# Copyright 2022 Cartesi Pte. Ltd.
#
# SPDX-License-Identifier: Apache-2.0
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use
# this file except in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.

from os import environ
from copy import deepcopy
from collections import defaultdict
import traceback
import logging
import requests
import json

from grids import init_grid, set_owners
from deps import Grid, Neighbours

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
logger.info(f"HTTP rollup_server url is {rollup_server}")

#Constants
MAX_GENERATIONS = 150

#Initialize grid
global grid
grid = init_grid

#Owned by
owners = set_owners()

#Initialize time
global last
last = 0

#Initialize block
global block
block = 0

#Game history array
global history
history = []

#state return
def convert_to_hex(s_input):
    return "0x"+str(s_input.encode("utf-8").hex())
def set_default(obj):
    if isinstance(obj, set):
        return list(obj)
def add_addresses(cells):
    cells_with_address = []
    for cell in cells:
        cells_with_address.append((cell[0], cell[1], owners[(cell)]))
    return cells_with_address
        
def get_state_hex():
    global grid
    data_set = {
        "grid": add_addresses(set_default(grid.cells)),
        "history": history,
        "dimensions": {
            "width": grid.dim.width,
            "height": grid.dim.height,
        },
        #"owners": owners,
        "block": block 
    }
    logger.info(data_set)
    json_object = json.dumps(data_set)
    hex_string = convert_to_hex(json_object)
    #logger.info("Inspect element return: "+ hex_string)
    return hex_string

#Define neighbor and enemy logic
def get_neighbours(grid: Grid, x: int, y: int) -> Neighbours:
    offsets = [(-1, -1), (0, -1), (1, -1), (-1, 0),
               (1, 0), (-1, 1), (0, 1), (1, 1)]
    possible_neighbours = {(x + x_add, y + y_add) for x_add, y_add in offsets}
    alive = {(pos[0], pos[1])
             for pos in possible_neighbours if pos in grid.cells}
    #alive_friends =
    #alive_enemies =
    #get address of majority
    majority_keeper = {}
    for cell in alive:
        address = owners[cell].lower()
        if address not in majority_keeper:
            majority_keeper[address] = 0
        majority_keeper[address] += 1
    
    logger.info("majority_keeper")
    logger.info(majority_keeper)
    majority = max(majority_keeper, key=majority_keeper.get) if majority_keeper != {} else "0x"

    logger.info("getting alive")
    logger.info(alive)
    return Neighbours(alive, possible_neighbours - alive, majority)

#Add cells
def add(cells, sender):
    global grid
    new_cells = deepcopy(grid.cells)
    for cell in cells:
        logger.info(cell)
        new_cell = (cell["x"], cell["y"])
        new_cells.add(new_cell)
        owners[new_cell] = sender #set owner
    grid = Grid(grid.dim, new_cells)

#Game of life logic
def update(grid: Grid) -> Grid:
    new_cells = deepcopy(grid.cells)
    undead = defaultdict(int)
    logger.info("getting grid")
    logger.info(grid.cells)
    for (x, y) in grid.cells:
        alive_neighbours, dead_neighbours, majority = get_neighbours(grid, x, y)
        #kill if it does not have 2 or 3 neightbors
        if len(alive_neighbours) not in [2, 3]:
            new_cells.remove((x, y))
            owners.pop((x, y))

        for pos in dead_neighbours:
            logger.info("getting pos in dead_neighbors")
            logger.info(pos)
            undead[pos] += 1
    
    #logger.info(undead.item())
    #logger.info(undead.items())

    for pos, _ in filter(lambda elem: elem[1] == 3, undead.items()):
        new_cells.add((pos[0], pos[1]))
        #determine owner
        owners[(pos[0], pos[1])] = majority

    return Grid(grid.dim, new_cells)

def hex2str(hex):
    """
    Decodes a hex string into a regular string
    """
    return bytes.fromhex(hex[2:]).decode("utf-8")

def str2hex(str):
    """
    Encodes a string as a hex string
    """
    return "0x" + str.encode("utf-8").hex()

def handle_advance(data):
    #fetch input data
    metadata = data["metadata"]
    payload = data["payload"][2:]
    sender = metadata["msg_sender"]
    epochIndex = metadata["epoch_index"]
    inputIndex = metadata["input_index"]
    blockNumber = metadata["block_number"] 
    timeStamp = metadata["timestamp"]

    #decode payload
    decoded = (bytes.fromhex(payload).decode("utf-8"))
    input_value = json.loads(decoded)
    operation = input_value["operation"]
    value = input_value["value"]

    logger.info(value)

    #update based on time
    # global last
    # if last - timeStamp >= 1 :
    #     global grid
    #     grid = update(grid)

    #process input
    if operation == "set":
        cells_to_add = value
        add(cells_to_add, sender)

    if operation == "step":
        global grid
        history.append(add_addresses(set_default(grid.cells)))
        for i in range(MAX_GENERATIONS):
            grid = update(grid)
            history.append(add_addresses(set_default(grid.cells)))
        
    last = timeStamp
    block = blockNumber

    logger.info("Here are the owners")
    logger.info(owners)
    
    """
    An advance request may be processed as follows:

    1. A notice may be generated, if appropriate:

    response = requests.post(rollup_server + "/notice", json={"payload": data["payload"]})
    logger.info(f"Received notice status {response.status_code} body {response.content}")

    2. During processing, any exception must be handled accordingly:

    try:
        # Execute sensible operation
        op.execute(params)

    except Exception as e:
        # status must be "reject"
        status = "reject"
        msg = "Error executing operation"
        logger.error(msg)
        response = requests.post(rollup_server + "/report", json={"payload": str2hex(msg)})

    finally:
        # Close any resource, if necessary
        res.close()

    3. Finish processing

    return status
    """

    """
    The sample code from the Echo DApp simply generates a notice with the payload of the
    request and print some log messages.
    """

    logger.info(f"Received advance request data {data}")

    status = "accept"
    try:
        logger.info("Adding notice")
        response = requests.post(rollup_server + "/notice", json={"payload": data["payload"]})
        logger.info(f"Received notice status {response.status_code} body {response.content}")

    except Exception as e:
        status = "reject"
        msg = f"Error processing data {data}\n{traceback.format_exc()}"
        logger.error(msg)
        response = requests.post(rollup_server + "/report", json={"payload": str2hex(msg)})
        logger.info(f"Received report status {response.status_code} body {response.content}")

    return status

def handle_inspect(data):
    #logger.info(f"Received inspect request data {data}")
    #logger.info("Adding report")
    payload = get_state_hex()
    response = requests.post(rollup_server + "/report", json={"payload": payload})
    #logger.info(f"Received report status {response.status_code}")
    return "accept"

handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

finish = {"status": "accept"}
rollup_address = None

while True:
    ##logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    ##logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        if "metadata" in data:
            metadata = data["metadata"]
            if metadata["epoch_index"] == 0 and metadata["input_index"] == 0:
                rollup_address = metadata["msg_sender"]
                logger.info(f"Captured rollup address: {rollup_address}")
                continue
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])
