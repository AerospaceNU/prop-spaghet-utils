import asyncio
import websockets
import json
import time
from tkinter import Tk, Label, Button, Entry, filedialog, StringVar, Frame, Canvas, Scrollbar, Text
import threading

WEBSOCKET_ADDRESS = "localhost:9002"
# also the first json displayed (good for tesing purposes!)
EXAMPLE_DATA_JSON = """{
    "command": "DATA",
    "calibrated?": "true",
    "data": {
        "loadCellSensors": {
            "EX_SENSOR_1": {
                "sensorReading": -5.476813068846521,
                "unit": "LBS"
            }
        },
        "pressureSensors": {
            "EX_SENSOR_2": {
                "sensorReading": 2.2792993667654207,
                "unit": "PSI"
            },
            "EX_SENSOR_3": {
                "sensorReading": 7.950959608789882,
                "unit": "KG_PER_SEC"
            }
        },
        "tempSensors": {
            "EX_SENSOR_4": {
                "sensorReading": 26.16680223534908,
                "unit": "CELSIUS"
            }
        },
        "valves": {
            "EX_SENSOR_1": {
                "valveState": "OPEN"
            },
            "EX_SENSOR_2": {
                "valveState": "CLOSED"
            },
            "EX_SENSOR_3": {
                "valveState": "INVALID"
            }
        }
    },

    "timeStamp": 1658422515934
}
"""
ERRORLESS_INFO = "Errors will appear here"

class LoggerApp:
    def __init__(self, mastash):
        self.master = mastash
        self.master.title("AeroNU Propulsion Logger")

        self.init_json_display_frame(mastash).grid(row=0, column=1, rowspan=2, sticky='NSEW')

        self.init_json_indexing_frame(mastash).grid(row=0, column=0, sticky='NSEW')

        self.init_log_frame(mastash).grid(row=1, column=0, sticky='NSEW')

        self.master.grid_columnconfigure(0,weight=1)
        self.master.grid_columnconfigure(1,weight=2)
        self.master.grid_rowconfigure(0,weight=1)
        self.master.grid_rowconfigure(1,weight=1)

        self.last_gui_update_time = 0 # not usued rn, might be useful later?
        self.newest_fresh_json_data = json.loads(EXAMPLE_DATA_JSON)
        self.cur_selected_json = self.newest_fresh_json_data

        worker_thread = threading.Thread(target=self.start_websocket, daemon=True)
        worker_thread.start()
        
        self.main_loop()

    def init_json_indexing_frame(self, master):
        frame  = Frame(master)

        address_label = Label(frame, text="JSON index:")
        self.address_var = StringVar(value='')
        address_entry = Entry(frame, textvariable=self.address_var)
        self.info_bar = Label(frame, text=ERRORLESS_INFO, fg="black")

        address_label.grid(row=0, column=0, sticky="W")
        address_entry.grid(row=0, column=1, sticky="WE")
        self.info_bar.grid(row=1, column=0, columnspan=3, sticky="W")

        frame.grid_columnconfigure(0,weight=1)
        frame.grid_columnconfigure(1,weight=2)
        frame.grid_rowconfigure(0,weight=0)
        frame.grid_rowconfigure(1,weight=0)

        return frame


    def init_log_frame(self, master):
        frame = Frame(master)
        address_label = Label(frame, text="Actual value:")
        calibrated_input_var = StringVar(value='N/A') # var needed to call get() on Entry later
        self.calibrated_input_entry = Entry(frame, textvariable=calibrated_input_var)

        log_button = Button(frame, text="Log calibration", command=self.add_calibration_pair)

        self.display_label = Text(frame)
        # self.display_label["state"] = "readonly"

        address_label.grid(row=0, column=0)
        self.calibrated_input_entry.grid(row=0, column=1)
        log_button.grid(row=0, column=2)
        self.display_label.grid(row=1, column=0, columnspan=3, sticky="NSEW")

        frame.grid_columnconfigure(0,weight=1)
        frame.grid_columnconfigure(1,weight=1)
        frame.grid_columnconfigure(2,weight=1)

        frame.grid_rowconfigure(0,weight=0)
        frame.grid_rowconfigure(1,weight=1)

        return frame


    def init_json_display_frame(self, master):
        frame = Frame(master)

        self.json_display_canvas = Canvas(frame, bg="gray94")
        scrolly = Scrollbar(frame, orient='vertical', command=self.json_display_canvas.yview)
        scrolly.grid(row=0, column=1, sticky="NSEW")
        frame.grid_columnconfigure(1,weight=0)


        self.json_display_canvas.configure(yscrollcommand=scrolly.set)
        self.json_display_canvas.grid(row=0, column=0, sticky="NSEW")
        frame.grid_columnconfigure(0,weight=1)

        frame.grid_rowconfigure(0, weight=1)

        return frame


    def add_calibration_pair(self):
        self.display_label.insert("end", f"\n{self.calibrated_input_entry.get()}, {self.cur_selected_json}")


    def main_loop(self):
        user_str = self.address_var.get()

        json_to_be_displayed = self.newest_fresh_json_data # set to default og json if user input doesn't work
        try:
            # lmao eval
            # yeah, it's a quick hack, but it's an convenient hack, and i don't
            # want to make a lexer/parser for the [] expressions for this
            # quick ass GUI
            json_to_be_displayed = eval(f"self.newest_fresh_json_data{user_str}")
            self.info_bar.config(fg="black", text=ERRORLESS_INFO)
        except SyntaxError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except KeyError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except Exception as e:
            self.info_bar.config(fg="red", text=repr(e))

        self.cur_selected_json = json.dumps(json_to_be_displayed, indent=4)
        self.json_display_canvas.delete("all") # rerender the new text
        self.json_display_canvas.create_text(10,0,text=self.cur_selected_json, anchor="nw")
        self.json_display_canvas.configure(scrollregion=self.json_display_canvas.bbox("all"))
        self.master.after(1000, self.main_loop)


    def start_websocket(self):
        asyncio.run(self.connect())


    async def connect(self):
        uri = f"ws://{WEBSOCKET_ADDRESS}"
        print("Connecting to: ", uri)
        async with websockets.connect(uri) as websocket:
            while True:
                data = await websocket.recv()
                json_data = json.loads(data)
                self.process_data(json_data)


    # This is where we get handle the ECS json reports. You'll want to update this if you start getting interesting info other than the items (e.g., loadcellsensors, aborts, etc.) below
    def process_data(self, json_data):
        if json_data['command'] == 'DATA':
            self.newest_fresh_json_data = json_data

        # only upate the GUI with json report count at 2Hz (time.time is in *seconds* not ms)
        # self.file_count += 1
        # if(time.time() - self.last_gui_update_time > 0.5):
        #     self.file_count_label.config(text=f"JSON reports received: {self.file_count}")
        #     self.last_gui_update_time = time.time()


if __name__ == "__main__":
    root = Tk()
    # root.geometry("1100x600")
    app = LoggerApp(root)
    root.mainloop()
