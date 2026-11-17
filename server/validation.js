export const text = (value, max, required = false) => typeof value === 'string' && (!required || value.trim().length > 0) && Buffer.byteLength(value, 'utf8') <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
export const profile = ({name,nip='',unit='',email=''}) => text(name,120,true) && text(nip,80) && text(unit,120) && text(email,254) && (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
export const caseData = ({no,title,description='',status='Investigation'}) => text(no,64,true) && /^[A-Za-z0-9._/-]{1,64}$/.test(no) && text(title,200,true) && text(description,4000) && ['Investigation','Filing','Closed'].includes(status)
export const evidenceId = (id) => typeof id === 'string' && /^[1-9][0-9]{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n
