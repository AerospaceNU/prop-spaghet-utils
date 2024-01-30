# prop-spaghet-utils
mini propulsion test stand util code

## Running the html GUI

1) cd into the directory where you clone/downloaded this code

2) run `python(3) run_gui.py`

(use python or python3 as appropriate for your configuration)

3) ensure you are connected to the pi, if you are not or the ecs is not running, you will see an error message about websockets.

## Running the logger

1) make sure tkinter is installed

2) open the window by running `python(3) ecs_logger.py`

3) choose a save directory for the logs, make sure you're connected to the pi (or sim) and update the address accordingly

4) click `start logging` to begin, and make sure the number of json reports increases if you are expecting data; the csv should also show up immediately and will be timestamped with epoch time

5) click `stop logging` when done

NB: To split the file mid-run (for analysis, etc.) click the split new file button. This will break off a new log csv file starting at the time of the click, and stop logging to the original file

## Adding more tests and states

To add more states and batches for future tests, update the `STATE_SETS.json` file, following the existing format. The web GUI will automatically populate the dropdowns from this information after restarting the page.

## Websocket Sim

If you wish to simulate JSON that would come in from the pi locally, run the `json_dummy_server.py` file and update the socket address (set to `const socket = new WebSocket('ws://localhost:9002/ws');`) in the `script.js` file accordingly. You can also edit the sample json file or add your own to change which values come in.
