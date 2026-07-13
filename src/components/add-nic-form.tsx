"use client";
import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { addNicAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";
export function AddNicForm(){const[state,action,pending]=useActionState(addNicAction,initialActionState);return <form action={action} className="nic-add-form"><label className="field"><span>Add NIC once</span><input name="nic" autoCapitalize="characters" placeholder="200012345678 or 123456789V" required/></label><p>After saving, the NIC becomes locked and can only be corrected by the administrator.</p>{state.message&&<p className={`form-message ${state.ok?"success":"error"}`}>{state.message}</p>}<button className="button button-primary" disabled={pending}>{pending?<LoaderCircle className="spin" size={18}/>:<LockKeyhole size={17}/>}Save and lock NIC</button></form>}
