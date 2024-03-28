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

        # left frame, for user controls
        left_frame  = Frame(self.master,  width=200,  height=  400)
        left_frame.grid(row=0, column=0, sticky="N")

        self.address_label = Label(left_frame, text="JSON index:")
        self.address_var = StringVar(value='')
        self.address_entry = Entry(left_frame, textvariable=self.address_var, width=100)
        self.info_bar = Label(left_frame, text=ERRORLESS_INFO, fg="black")

        self.calibrated_input_var = StringVar(value='N/A')
        self.calibrated_input_entry = Entry(left_frame, textvariable=self.calibrated_input_var)
        self.log_button = Button(left_frame,text="Log calibration", command=self.update_shit)
        self.display_var = StringVar(value='')
        self.display_label = Text(left_frame, height=4, width=50)
        # self.display_label["state"] = "readonly"

        self.address_label.grid(row=1, column=0, sticky="N")
        self.address_entry.grid(row=1, column=1, columnspan=2, sticky="N")
        self.info_bar.grid(row=2, column=1)
        self.calibrated_input_entry.grid(row=3, column=0)
        self.log_button.grid(row=4, column=0)
        self.display_label.grid(row=5, column=0)



        # right frame, for json display
        right_frame = Frame(mastash,  width=400,  height= 400)
        right_frame.grid(row=0, column=1, sticky='news')

        self.canvas = Canvas(right_frame, bg="gray94", width=400,  height=700)
        scrolly = Scrollbar(right_frame, orient='vertical', command=self.canvas.yview)
        scrolly.grid(row=0, column=1, sticky='ns')

        self.canvas.configure(yscrollcommand=scrolly.set)
        self.canvas.grid(row=0, column=0)

        self.last_gui_update_time = 0
        self.newest_fresh_json_data = json.loads(EXAMPLE_DATA_JSON)
        self.cur_selected_json = self.newest_fresh_json_data

        self.worker_thread = threading.Thread(target=self.start_websocket, daemon=True)
        self.worker_thread.start()
        
        self.main_loop()


    def update_shit(self):
        self.display_label.insert("end", f"\n{self.calibrated_input_entry.get()}, {self.cur_selected_json}")


    def main_loop(self):
        user_str = self.address_var.get()

        json_to_be_displayed = self.newest_fresh_json_data # set to default og json if user input doesn't work
        try:
            json_to_be_displayed = eval(f"self.newest_fresh_json_data{user_str}")
            self.info_bar.config(fg="black", text=ERRORLESS_INFO)
        except SyntaxError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except KeyError as e:
            self.info_bar.config(fg="red", text=repr(e))
        except Exception as e:
            self.info_bar.config(fg="red", text=repr(e))

        self.cur_selected_json = json.dumps(json_to_be_displayed, indent=4)
        self.canvas.delete("all") # rerender the new text
        self.canvas.create_text(10,0,text=self.cur_selected_json, anchor="nw", width=700)
        self.canvas.configure(scrollregion=self.canvas.bbox("all"))
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
    root.geometry("1000x700")
    app = LoggerApp(root)
    root.mainloop()
